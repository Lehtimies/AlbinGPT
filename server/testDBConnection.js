require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";

(async () => {
    try {
        console.log("Connecting to MongoDB...");
        const client = new MongoClient(uri);
        await client.connect();
        console.log("Connected to MongoDB successfully!");
        const db = client.db("test"); // Replace with your database name if needed
        const collections = await db.listCollections().toArray();
        console.log("Collections in 'test' database:", collections);
        await client.close();
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
})();
