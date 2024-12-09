const express = require('express');
let path = require('path');

const app = express();
const port = 3000;

// Serve the static files from the directory
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'AlbinGPT.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'AlbinGPT-chat.html'));
});

process.on('SIGINT', () => {
    console.log('Gracefully shutting down client');
    process.exit(0);
});

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
