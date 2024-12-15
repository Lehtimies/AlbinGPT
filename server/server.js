// Description: Server code for the AlbinGPT chat application

const express = require("express");
const OpenAI = require("openai");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const admin = require("firebase-admin");
const multer = require("multer");
require("dotenv").config();

const app = express();
const port = 5000;
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const model = "gpt-4o"; // Specifies the model, e.g. gpt-4o-mini, gpt-4 or gpt-3
let db;
let currentId;

// Check if the required environment variables are set
const checkEnvVar = (envVar) => {
    if (!process.env[envVar]) {
        console.error(`${envVar} missing from environment variables. Please check your .env file`);
        process.exit(1);
    }
}
checkEnvVar("OPENAI_API_KEY");
checkEnvVar("MONGO_URI");
checkEnvVar("FIREBASE_STORAGE_BUCKET");

// Initialize Firebase Admin with Service Account
const serviceAccount = require("./firebase-service-key.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

// Refrence to the storage bucket
const bucket = admin.storage().bucket();

// Configure multer to store uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// Initialize messages with the system message
const initializeMessages = [{ 
    role: "system", 
    content: `You are Albin, master of the universe and a helpful assistant. 
        input-format: plain-text, output-format: plain-text;
        Return answers in plain text, NOT IN MARKDOWN OR LATEX OR ANYTHING LIKE THAT! 
        Again make sure to return it as plain text, for example math would be returned like this "x = ±√2", 
        no "###" for headings or back ticks like "\\" for math/physics or anything that would style the text. Only PLAIN TEXT.`
}];

app.use(cors());
app.use(express.json());

// Configure OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

let messageHistory = [];    // Store messages for the session

let messages = [
    initializeMessages[0]
];

async function connectToDatabase() {
    try {
        if (!db) {
            console.log("Connecting to database...");
            await client.connect();
            console.log("Successfully connected to database");
            
            // Select the database or create it if it doesn't exist yet
            db = client.db("AlbinGPT");
            console.log("Database selected: ", db.databaseName);

            // Ensure that the counters collection exists and has the conversationId field
            await db.collection("counters").updateOne(
                { _id: "conversationId" },
                { $setOnInsert: { currentId: 1 } },
                { upsert: true }
            );
        }
    } catch (error) {
        console.error("Error connecting to database: ", error);
    }
};

// Function to update the conversationId
async function getNextId() {
    try {
        const result = await db.collection("counters").findOneAndUpdate(
            { _id: "conversationId" }, 
            { $inc: { currentId: 1 } },
            { returnDocument: "after", upsert: true }
        );
        console.log("Next conversation ID retrieved: ", result.currentId);
        return result.currentId;
    } catch (error) {
        console.error("Error updating Id: ", error);
    }
};

async function getCurrentId() {
    try {
        if (!db) {
            throw new Error("Database not initialized");
        }

        // Return the currentId from the database
        const result = await db.collection("counters").findOne( { _id: "conversationId" }, { _id: 0, currentId: 1 });
        return result.currentId;
    } catch (error) {
        console.error("Error retrieving currentId: ", error);
    }
};

// Function to get the filepaths from the firebase image url's
function getFilePathFromUrl(url) {
    const decodedUrl = decodeURIComponent(url);
    const match = decodedUrl.match(/\.app\/(.*)$/); // Match the file path after the .app/ part of the URL
    if (match && match[1]) {
        console.log("Extracted file path: ", match[1]);
        return match[1]; // Return the file path
    }
    throw new Error("Invalid Firebase Storage URL");
};

// Function to delete uploads directory in Firebase storage
async function deleteAllImageUploads() {
    try {
        console.log("Deleting all images in 'uploads/' directory...");

        // Get all files in the uploads directory
        const [files] = await bucket.getFiles({prefix: "uploads/"}); 

        if (files.length === 0) {
            console.log("No files found in 'uploads/' directory");
            return;
        }

        // Attempt to delete all files in the uploads directory
        const deleteResults = await Promise.allSettled(
            files.map((file) =>
                file.delete().then(() => {
                    return { filePath: file.name, status: "deleted" };
                })
            )
        );

        // Analyze the results of the deletion operation
        const success = [];
        const failures = [];

        deleteResults.forEach((result) => {
            if (result.status === "fulfilled") {
                success.push(result.value);
            } else {
                failures.push({
                    // Log the failed deletions
                    filePath: result.reason.config ? result.reason.config.file : "Unknown",
                    error: result.reason.message || "Unknown error",
                });
            }
        });

        // Log the results of the deletion operation
        console.log(`Successfully deleted ${success.length} files`);
        if (failures.length > 0) {
            console.error(`Failed to delete ${failures.length} files`);
            failures.forEach((failure) => {
                console.error(`Failed to delete file: ${failure.filePath}. Reason: ${failure.error}`);
            });
        }
    } catch (error) {
        console.error("Error deleting 'uploads/' directory:", error);
        throw new Error("Failed to delete 'uploads/' directory");
    }
};

// Endpoint to upload images to Firebase
app.post("/api/upload-image", upload.single("file"), async (req,res) => {
    try {
        // Check if a file was uploaded
        console.log("File uploaded:", req.file);
        console.log("Req body:", req.body);
        if (!req.file) {
            return res.status(400).send("No file uploaded")
        }

        // Check if the file is an image
        if (!req.file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
            return res.status(400).send("Please upload an image file")
        }

        // Generate a file name
        const fileName = `uploads/${Date.now()}_${req.file.originalname}`;

        // Create a reference in Firebase Storage
        const file = bucket.file(fileName);

        // Upload the file
        await file.save(req.file.buffer, {
            metadata: {
                contentType: req.file.mimetype,
            },
            public: true, // Make the file publically available so it can be sent to OpenAI
        });

        // Get the public image URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        console.log("Image uploaded to Firebase: ", publicUrl);

        // Send the URL to the client
        res.status(200).json({ url: publicUrl });
    } catch (error) {
        console.error("Error uploading image to Firebase:", error);
        res.status(500).send("Failed to upload file.");
    }
});

// Endpoint to delete images from Firebase storage
app.delete("/api/delete-images", async (req, res) => {
    try {
        const { urls } = req.body; // Should be an array of URLs
        console.log("URLs to delete:", urls);

        // Check if the URLs are valid
        if (!Array.isArray(urls)) {
            return res.status(400).send("Please provide an array of imageURLs");
        }

        // Extract the file paths from the URLs and delete the files
        const deletePromises = urls.map(async (url) => {
            const filePath = getFilePathFromUrl(url);
            return bucket.file(filePath).delete()
                .then(() => ({ filePath, status: "deleted" }))
                .catch((error) => ({ filePath, status: "failed", error: error.message }));
        });

        // Wait for all the promises to resolve
        const results = await Promise.all(deletePromises);
        console.log("Results of image deletion:", results);

        // Send the results to the client
        return res.status(200).send({ message: "Images deleted", results });
    } catch (error) {
        console.error("Error deleting images from Firebase: ", error);
        res.status(500).send("Failed to delete images.");
    }
});

// Endpoint to load conversations from db
app.post("/api/load-conversations", async (req, res) => {
    const { db_id } = req.body;
    
    // Check if the conversation ID is valid
    if (!db_id || typeof db_id !== "number") {
        return res.status(400).json({ error: "Invalid conversation ID format. Number expected" });
    }
    
    // Check if the conversation ID exists in the database
    const conversationExists = await db.collection("conversations").findOne({ _id: db_id });
    if (!conversationExists) {
        return res.status(404).json({ error: "Conversation ID not found" });
    };

    currentId = db_id; // Update the currentId to the one sent from the client

    try {
        const conversations = db.collection("conversations");

        // Load the conversation from the database
        const result = await conversations.findOne({ _id: currentId }, { _id: 0, messages: 1 });
        messageHistory = result ? result.messages : []; // If no result, set messageHistory to empty array
        console.log("Message History from db: ", messageHistory)
        
        // Put the last 10 searches into memory (the ones that get sent to OpenAI)
        if (messageHistory.length > 10) {
            const messageToSlice = messageHistory.length - 10;
            messages = [initializeMessages[0], ...messageHistory.slice(messageToSlice)];
        } else {
            messages = [initializeMessages[0], ...messageHistory];
        }
        console.log("Messages loaded from db: ", messages);

        // Send response to client
        res.status(200).json({ message : "Messages loaded from db" });
    } catch (error) {
        console.error("Error loading conversations from db: ", error);
        res.status(500).json({ error: "Failed to load conversation data from database" });
    }
});

app.get("/api/conversations/get-id-and-summaries", async (req, res) => {
    try {
        const conversationsList = await db.collection("conversations").find({}, { _id: 1, _summary: 1 }).toArray();
        res.status(200).json({ conversations: conversationsList });
        
        // DEBUGGING
        //console.log("Conversation data sent to client: ", conversationsList);
    } catch (error) {
        console.error("Error retrieving conversation data: ", error);
        res.status(500).json({ error: "Failed to retrieve conversation data" });
    }
});

// Endpoint to send messages to OpenAI
app.post("/api/chat", async (req, res) => {
    const { userInput } = req.body;

    if (!userInput || typeof userInput !== "string") {
        return res.status(400).json({ error: "Invalid user message format. String expected" });
    }

    // Append user message to messages
    messages.push({ 
        role: "user", 
        content: [
            { type: "text", text: userInput }, 
            /*{ 
                type: "image_url", 
                image_url: {"url": "https://storage.googleapis.com/albingpt.firebasestorage.app/uploads/1734281861032_math-test-img.PNG"}
            }*/
            ] 
        });
    messageHistory.push({ role: "user", content: userInput });

    // Limit messages to 10
    if (messages.length > 10) {
        messages.splice(1, 2);
    }

    console.log("Messages array: ", messages);
    console.log("Messages array length: ", messages.length);

    try {
        // Send messages to OpenAI
        const response = await openai.chat.completions.create({
            model: model, // Specifies the gpt model
            messages: messages
        });

        // Log the token count
        const tokens = response.usage.total_tokens;
        console.log("Token count: ", tokens);

        // Get OpenAI response and append to messages
        const assistantResponse = response.choices[0].message.content;
        messages.push({ role: "assistant", content: assistantResponse });
        messageHistory.push({ role: "assistant", content: assistantResponse });
        console.log("Message History: ", messageHistory)

        // Check if the currentId exists in the database
        const conversations = db.collection("conversations");
        const existingConversation = await conversations.findOne({ _id: currentId });
        
        if (!existingConversation) {
            // If the conversation doesn't exist, create it
            // Get the summary of the user message to be used as a title for the conversation
            const summaryResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini", // Specifies the gpt model for the summary (Hardcoded cuz it"s cheaper (; )
                messages: [{
                    role: "user", 
                    content: `Summarize the following sentence into 1-5 words: ` + userInput + `.
                    Remember, only a summary of the sentence. NOT AN ANSWER! Give the summary only in words and not 
                    anything else like "?", ".", "!" or flavor text.`
                }]
            });
            const summary = summaryResponse.choices[0].message.content;

            // Insert the conversation into the database
            await conversations.insertOne(
                { _id: currentId, messages: messageHistory, summary: summary }
            );
            
            res.status(201).json({ 
                content: assistantResponse,
                summary: summary,
                db_id: currentId
            });
        } else {
            conversations.updateOne(
                { _id: currentId }, 
                { $set: { messages: messageHistory } }, 
                { upsert: true }
            );
            // Send response to client
            res.status(200).json({ 
                content : assistantResponse 
            });
        }

    } catch (error) {
        console.error("Error: ", error);
        res.status(500).json({ 
            error: "Internal server error" 
        });
    }
});

// Endpoint to retrieve messages for the current session
app.get("/api/messages", (req, res) => {
    try {
        console.log("Messages sent to client");
        res.status(200).json({ messages: messageHistory });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Endpoint to delete the entire database
app.delete("/api/conversations/deleteAll", async (req, res) => {
    try {
        console.log("Deleting database...");
        await db.collection("conversations").drop();
        await db.collection("counters").drop();
        console.log("Database deleted");
        
        // Recreate the counters collection
        await db.collection("counters").updateOne(
            { _id: "conversationId" },
            { $setOnInsert: { currentId: 1 } },
            { upsert: true }
        );
        // Reset the currentId to 1
        currentId = await getCurrentId();

        // Delete all images in the uploads directory
        await deleteAllImageUploads();

        res.status(200).json({ message: "Database deleted" });
    } catch (error) {
        console.error("Error deleting database: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Endpoint to end session
app.post("/api/end-session", async(req, res) => {
    // Check if messages have been sent in the current session
    if (messageHistory.length !== 0) {
        // Reset message history to initialize for the next session
        messageHistory = [];
        messages = [initializeMessages[0]];
    }

    currentId = await getCurrentId();
    // Check if the currentId exists in the database
    const conversationExists = await db.collection("conversations").findOne({ _id: currentId });
    if (conversationExists) {
        // If it exists, increment the ID to ensure a unique next ID
        currentId = await getNextId();
    }
    console.log("Next session conversation ID: ", currentId);
    console.log("Session ended");
    res.status(200).json({ message: "Session ended" });
});

// Message to user upon opening server
app.get("/", (req, res) => {
    res.send("Server running");
});

// Start the server
async function startServer() {
    try {
        // Connect to the database
        await connectToDatabase();
        currentId = await getCurrentId();
        console.log("Current conversation ID: ", currentId);

        // Start the server
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error("Error starting server: ", error);
    }
};

// Function to close the server
async function endSession() {
    try {
        // Check if messages have been sent in the current session
        if (messageHistory.length !== 0) {
        // Reset message history to initialize for the next session
        messageHistory = [];
        messages = [initializeMessages[0]];
        }

        currentId = await getCurrentId();
        // Check if the currentId exists in the database
        const conversationExists = await db.collection("conversations").findOne({ _id: currentId });
        if (conversationExists) {
            // If it exists, increment the ID to ensure a unique next ID
            currentId = await getNextId();
        }
        console.log("Next session conversation ID: ", currentId);
        console.log("Session ended");
    } catch (error) {
        console.error("Error ending session: ", error);
    }
}

// Handle shutdown gracefully (CTRL + C)
process.on("SIGINT", async () => {
    console.log("Gracefully shutting down server");
    await endSession();
    await client.close();
    console.log("MongoDB connection closed");
    process.exit(0);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
    console.error("Unhandled promise rejection: ", error);
    process.exit(1);
});

startServer();