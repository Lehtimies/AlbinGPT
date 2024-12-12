// Description: JavaScript file for the AlbinGPT chat application

// Function to toggle the sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const openButton = document.getElementById('openSidebarBtn');

    sidebar.classList.toggle('sidebar-hidden');
    openButton.classList.toggle('hidden');
};

// Function to type out text in a given element at a set speed
function typeOutText(elementID, text, speed, chunkSize) {
    return new Promise((resolve) => {
        const element = document.getElementById(elementID);
        
        let i = 0;
        const typeCharacter = () => {
            if (i < text.length) {
                element.innerHTML += text.substring(i, i + chunkSize);
                i += chunkSize;
                setTimeout(typeCharacter, speed);
            } else {
                resolve();
            }
        }
        typeCharacter();
    });
};

// Function to handle the user message
async function handleMessage() {
    const userMessage = document.getElementById('userMessage').value;

    // Check that message isn't empty
    if (userMessage.trim().length === 0) {
        console.log("Message is empty!")
        return;
    }

    document.getElementById('userMessage').value = '';
    document.getElementById('userMessage').style.height = 'auto';

    try {
        const assistantResponse = await sendMessage(userMessage);
        typeOutText('gptOutput', 'Albin: \n' + assistantResponse, 1, 2);
    } catch (error) {
        console.error('Error while sending out message: ', error);
    }
};

async function printUserMessage(userMessage) {
    // Print the user message to the output
    const outputElement = document.getElementById('gptOutput');
    const outputText = document.createElement('div');
    outputText.className = 'user-output-container';
    outputText.innerHTML = userMessage;
    outputElement.appendChild(outputText);
};

// Function to send a message to the server
async function sendMessage(userMessage) {
    console.log('User message: ', userMessage);

    await printUserMessage(userMessage);
    //await typeOutText('gptOutput', 'User: \n' + userMessage + '\n \n', 5, 1);

    try {
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userMessage })
        });

        // Parse the response
        let data;
        try {
            data = await response.json();
            console.log("Parsed data: ", data);
        } catch (error) {
            console.error("Error while parsing response: ", error);
        }

        // Check for errors
        if (!response.ok) {
            if (response.status === 400) {
                console.error('Bad Request', response.status, data.error);
                return ('Invalid user message format. String expected');
            }
    
            if (response.status === 500) {
                console.error('Internal Server Error', response.status, data.error);
                return ('Internal server error, please try again');
            }
    
            // Default error message
            console.error('Error', response.status);
            return (`An error occurred, ${response.statusText}`);
        }

        // Handle the response
        if (response.ok) {
            if (response.status === 200) {
                return data.content;
            }

            if (response.status === 201) {
                const summary = data.summary;
                const db_id = data.db_id;
                console.log('New conversation started, Summary and ID: ', summary, db_id);
                createChatHistoryElement(db_id, summary);
                return data.content;
            }
        }
    } catch (error) {
        console.error('Error while sending message: ', error);
        return ('An error occurred, please try again');
    }
};

// Function to clear conversation history
async function clearChatHistory() {
    try {
        const response = await fetch('http://localhost:5000/api/conversations/deleteAll', {
            method: 'DELETE'
        });

        // Parse the response
        let data;
        try {
            data = await response.json();
            console.log('Parsed data: ', data);
        } catch (error) {
            console.error('Error while parsing response: ', error);
        }

        // Check for errors
        if (!response.ok) {
            console.error('Error:', response.status, data.error);
            return;
        }

        if (response.ok) {
            // Clear the chat history list
            const chatHistory = document.getElementById('chatHistory');
            chatHistory.innerHTML = '';
            console.log('Chat history cleared');
        }
    } catch (error) {
        console.error('Error while clearing chat history: ', error);
    }
};

// Function to start a new chat session and end the current one
async function endSession() {
    try {
        // Open a new chat
        window.location.href = '/chat';
        console.log('New chat opened');

        // End the session
        const response = await fetch('http://localhost:5000/api/end-session', {
            method: 'POST'
        });
    
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error while ending session: ', error);
    }
};

// Function to check whether a session is ongoing
async function checkSession() {
    try {
        const response = await fetch('http://localhost:5000/api/messages', {
            method: 'GET'
        });
    
        // Parse the response
        let data;
        try {
            data = await response.json();
            console.log("", data);
        } catch (error) {
            console.error('Error while parsing response: ', error);
        }
        
        // Check if the response is OK
        if (!response.ok) {
            console.error('Error:', response.status, data.error);
            return;
        }
        
        // Check if there are any messages
        const messages = data.messages;
        if (messages.length === 0) {
            console.log('No ongoing session');
            return;
        }
        console.log('Messages array: ', messages);
        
        // Set the block size based on the number of messages
        let blockSize = 10;
        if (messages.length > 5) {
            blockSize = 20;
        }
        if (messages.length > 15) {
            blockSize = 30;
        }

        // Prints out the messages to the output
        for (const message of messages) {
            switch (message.role) {
                case 'user':
                    await printUserMessage(message.content);
                    //await typeOutText('gptOutput', 'User: \n' + message.content + '\n \n', 0.1, blockSize);
                    break;
                case 'assistant':
                    await typeOutText('gptOutput', 'Albin: \n' + message.content, 0.1, blockSize);
                    break;
                default:
                    console.error('Invalid role: ', message.role);
            }
        }
    } catch (error) {
        console.error('Error while checking session: ', error);
    }
};

// Function to load an old conversation from the database based on the session ID
async function loadConversation(db_id) {
    try {
        console.log('Loading conversation with ID: ', db_id);
        console.log('ID type: ', typeof db_id);
        const response = await fetch('http://localhost:5000/api/load-conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ db_id })
        });
        console.log('Response: ', response);

        // Parse the response
        let data;
        try {
            data = await response.json();
        } catch (error) {
            console.error('Error while parsing response: ', error);
        }
        
        // Check if the response is OK
        if (!response.ok) {
            console.error('Error:', response.status, data.error);
            return;
        }
        console.log(data.message);
        
        // End the current session
        window.location.href = '/chat';
    } catch (error) {
        console.error('Error while loading conversation: ', error);
    }
};

// Function to get all chat history from the database and populate the chat history list
async function populateChatHistory() {
    try {
        // Fetch the chat history from the database
        const response = await fetch('http://localhost:5000/api/conversations/get-id-and-summaries', {
            method: 'GET'
        });
        console.log('Response: ', response);

        // Parse the response
        let data;
        try {
            data = await response.json();
            console.log('Data: ', data);
        } catch (error) {
            console.error('Error while parsing response: ', error);
        }

        // Check if the response is OK
        if (!response.ok) {
            console.error('Error: ', response.status, data.error);
            return;
        }

        // Populate the chat history list
        const conversationList = data.conversations;
        console.log('Conversation list: ', conversationList);
        conversationList.forEach((conversation) => {
            createChatHistoryElement(conversation._id, conversation.summary);
        });
    } catch (error) {
        console.error('Error while populating chat history: ', error);
    }
};

// Function to create a chat-history element
function createChatHistoryElement(db_id, summary) {
    // Get the chat history element
    const chatHistory = document.getElementById('chatHistory');
    const chatHistoryElement = document.createElement('li');
    const chatHistoryButton = document.createElement('button');
    const previousElement = chatHistory.firstChild; // Get first item in historyList

    // Define the list item properties
    chatHistoryElement.className = 'chat-history-list-item';

    // Define the button properties
    chatHistoryButton.type = 'button';
    chatHistoryButton.className = 'button-chat-history padding-x-5';
    chatHistoryButton.onclick = () => loadConversation(db_id);
    chatHistoryButton.innerHTML = summary;

    // Append the button to the list item and the list item to the chat history
    chatHistoryElement.appendChild(chatHistoryButton);
    chatHistory.insertBefore(chatHistoryElement, previousElement); // Insert at the beginning
};