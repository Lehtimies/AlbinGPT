// Description: JavaScript file for the AlbinGPT chat application

// Function to toggle the sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const openButton = document.getElementById('openSidebarBtn');

    sidebar.classList.toggle('sidebar-hidden');
    openButton.classList.toggle('hidden');
};

// Function to type out text in a given element at a set speed
function typeOutText(element, text, speed, chunkSize) {
    return new Promise((resolve) => {
        let i = 0;
        const typeCharacter = () => {
            if (i < text.length) {
                //element.innerHTML += text.substring(i, i + chunkSize);
                element.textContent += text.substring(i, i + chunkSize);
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
    const userInput = document.getElementById('userInput').textContent;
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const images = imagePreviewContainer.querySelectorAll('.image-wrapper img');

    // Get the image URLs
    const userImageUrls = [];
    images.forEach((img) => {
        if (img.src) {
            userImageUrls.push(img.src);
        }
    });

    // Check that message isn't empty
    if (userInput.trim().length === 0) {
        console.log("Message is empty!")
        return;
    }
    
    // Clear the image preview container
    while (imagePreviewContainer.firstChild) {
        imagePreviewContainer.removeChild(imagePreviewContainer.firstChild);
    }

    // hide the image container if it is empty
    if (imagePreviewContainer.innerHTML === '' && !imagePreviewContainer.classList.contains('hidden')) {
        imagePreviewContainer.classList.toggle('hidden');
    }

    document.getElementById('userInput').textContent = '';
    document.getElementById('userInput').style.height = 'auto';

    try {
        if (userImageUrls.length > 0) {
            console.log('User images:', userImageUrls);
            printUserImages(userImageUrls);
        }
        printUserMessage(userInput);
        const assistantResponse = await sendMessage(userInput, userImageUrls);
        printAsssistantMessage('Albin: \n' + assistantResponse, 1, 2);
        //typeOutText('gptOutput', 'Albin: \n' + assistantResponse, 1, 2);
    } catch (error) {
        console.error('Error while sending out message: ', error);
    }
};

async function printAsssistantMessage(assistantResponse, speed, chunkSize) {
    // Print the assistant message to the output
    const output = document.getElementById('gptOutput');
    const assistantMessage = document.createElement('div');
    assistantMessage.classList.add('assistant-output-container');

    // Append the assistant message to the output
    output.appendChild(assistantMessage);
    await typeOutText(assistantMessage, assistantResponse, speed, chunkSize);
};

function printUserImages(userImageUrls) {
    // Print the user images to the output
    const outputElement = document.getElementById('gptOutput');
    const outputImages = document.createElement('div');
    outputImages.classList.add('image-output-container');

    // Create the image elements
    for (const url of userImageUrls) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Output Image';
        img.classList.add('output-image');
        outputImages.appendChild(img);
    }

    outputElement.appendChild(outputImages);
}

function printUserMessage(userInput) {
    // Print the user message to the output
    const outputElement = document.getElementById('gptOutput');
    const outputText = document.createElement('div');
    outputText.classList.add('user-output-container');
    outputText.textContent = userInput;
    outputElement.appendChild(outputText);
};

// Function to display a pasted image in the imagePreviewContainer
function displayImage(imgURL) {
    const container = document.getElementById('imagePreviewContainer');
    const imageWrapper = document.createElement('div');
    imageWrapper.classList.add('image-wrapper')

    // Check if the image container is hidden, if so then make it visible
    if (container.classList.contains('hidden')) {
        container.classList.toggle('hidden');
    }

    // Create the pasted image
    const img = document.createElement('img');
    img.src = imgURL;
    img.alt = 'Pasted Image';
    img.classList.add('pasted-image');

    // Create the close button
    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'x';
    closeBtn.classList.add('image-close-button');
    closeBtn.onclick = () => {
        // Remove the image from the container and delete it from storage
        container.removeChild(imageWrapper);
        deleteImages([imgURL]);

        // hide the image container if it is empty
        if (container.innerHTML === '') {
            container.classList.toggle('hidden');
        }
    };

    // Append the image an close button to the wrapper and the wrapper to the container
    imageWrapper.appendChild(img);
    imageWrapper.appendChild(closeBtn);
    container.appendChild(imageWrapper);
};

// Function to delete one or several images from storage
async function deleteImages(urls) {
    try {
        console.log('Deleting images: ', urls);
        const response = await fetch('http://localhost:5000/api/delete-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls })
        });

        // Parse the response
        console.log('Response: ', response);
        let data;
        try {
            data = await response.json();
            console.log('Parsed data: ', data);
        } catch (error) {
            console.error('Error while parsing response: ', error);
        }

        // Check for errors
        if (!response.ok) {
            if (response.status === 400) {
                console.error('Bad Request', response.status, data.error);
                return;
            }
    
            if (response.status === 500) {
                console.error('Internal Server Error', response.status, data.error);
                return;
            }
    
            // Default error message
            console.error('Error', response.status);
            return;
        }

        // Handle the response
        if (response.ok) {
            if (response.status === 200) {
                console.log('Images deleted successfully');
            }
        }
    } catch (error) {
        console.error('Error while deleting images: ', error);
    }
};

// Function to upload an image to storage
async function uploadImage(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('http://localhost:5000/api/upload-image', {
            method: 'POST',
            body: formData
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
            if (response.status === 400) {
                console.error('Bad Request', response.status, data.error);
                return null;
            }
    
            if (response.status === 500) {
                console.error('Internal Server Error', response.status, data.error);
                return null;
            }
    
            // Default error message
            console.error('Error', response.status);
            return null;
        }

        // Handle the response
        if (response.ok) {
            if (response.status === 200) {
                console.log('Image uploaded successfully');
                return data.url;
            }
        }

    } catch (error) {
        console.error('Error while uploading image: ', error);
        return null;
    }
}

// Function to send a message to the server
async function sendMessage(userInput, userImageUrls) {
    // DEBUGGING
    console.log('User message:', userInput);
    console.log('User images:', userImageUrls);
    console.log('Message type:', typeof userInput);
    console.log('JSON being sent to server:', JSON.stringify({userInput}));

    // Create content object to send to server
    const content = [{type: "text", text: userInput}];
    userImageUrls.forEach((url) => {
        const image = {type: "image_url", image_url: {url}};
        content.push(image);
    });
    console.log('Content object to send:', content);

    try {
            const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
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

// Function to check whether a session is ongoing and display the messages if it is
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
                    // Check if the user message contains images and add them to an array
                    const image_urls = [];
                    message.content.forEach(async (content) => {
                        if (content.type === 'image_url') {
                            image_urls.push(content.image_url.url);
                        }
                    });
                    // Print the user images and message
                    if (image_urls.length > 0) {
                        printUserImages(image_urls);
                    }
                    printUserMessage(message.content[0].text);
                    break;
                case 'assistant':
                    //await typeOutText('gptOutput', 'Albin: \n' + message.content, 0.1, blockSize);
                    await printAsssistantMessage('Albin: \n' + message.content, 0.1, blockSize);
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