const express = require('express');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = 5000;

const initializeMessages = [
    { role: "system", content: "You are Albin, master of the universe and a helpful assistant." },
];

app.use(express.json());

// Configur OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

let messages = [
    initializeMessages[0]
];

// Endpoint to send messages to OpenAI
app.post('api/chat', async (req, res) => {
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
            model: "gpt-4o-mini",
            messages: messages
        });

        // Get OpenAI response and append to messages
        const assistantResponse = response.choices[0].message.content;
        messages.push({ role: "assistant", content: assistantResponse });

        // Send response to client
        res.json({ 
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
app.post('/api/end', (res) => {
    messages = [
        initializeMessages[0]
    ];
    res.json({ message: 'Session ended' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});