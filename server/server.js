const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 5000;

const initializeMessages = [
    { role: "system", content: "You are Albin, master of the universe and a helpful assistant." },
];

app.use(cors());
app.use(express.json());

// Configure OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

let messages = [
    initializeMessages[0]
];

// Endpoint to send messages to OpenAI
app.post('/api/chat', async (req, res) => {
    const { userMessage } = req.body;

    if (!userMessage || typeof userMessage !== 'string') {
        return res.status(400).json({ error: 'Invalid user message format. String expected' });
    }

    // Append user message to messages
    messages.push({ role: "user", content: userMessage });

    // Limit messages to 10
    if (messages.length > 10) {
        messages = messages.slice(-10);
    };

    try {
        // Send messages to OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Specifies the model, e.g. gpt-4o-mini, gpt-4 or gpt-3
            messages: messages
        });

        // Get OpenAI response and append to messages
        const assistantResponse = response.choices[0].message.content;
        messages.push({ role: "assistant", content: assistantResponse });

        // Send response to client
        res.status(200).json({ 
            content : assistantResponse 
        });
    } catch (error) {
        console.error('Error: ', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
});

// Endpoint to end session
app.post('/api/end', (req, res) => {
    messages = [
        initializeMessages[0]
    ];
    res.status(200).json({ message: 'Session ended' });
});

// Message to user upon opening server
app.get('/', (req, res) => {
    res.send('Server running');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});