function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const openButton = document.getElementById('openSidebarBtn');

    sidebar.classList.toggle('sidebar-hidden');
    openButton.classList.toggle('hidden');
}

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
}

async function handleMessage() {
    const userMessage = document.getElementById('userMessage').value;
    document.getElementById('userMessage').value = '';

    try {
        const assistantResponse = await sendMessage(userMessage);
        typeOutText('gptOutput', 'Albin: \n' + assistantResponse + '\n \n', 5, 1);
    } catch (error) {
        console.error('Error while sending out message: ', error);
    }
}

async function sendMessage(userMessage) {
    console.log('User message: ', userMessage);
    await typeOutText('gptOutput', 'User: \n' + userMessage + '\n \n', 5, 1);

    try {
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userMessage })
        });

        if (!response.ok) {
            if (response.status === 400) {
                console.error('Bad Request', response.status);
                return ('Invalid user message format. String expected');
            }
    
            if (response.status === 500) {
                console.error('Internal Server Error', response.status);
                return ('Internal server error, please try again');
            }
    
            // Default error message
            console.error('Error', response.status);
            return (`An error occurred, ${response.statusText}`);
        }
    
        const data = await response.json();
        console.log(data);
        return data.content;
    } catch (error) {
        console.error('Error while sending message: ', error);
        return ('An error occurred, please try again');
    }
} 


async function endSession() {
    try {
        // Open a new chat
        window.location.href = 'AlbinGPT-chat.html';
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
}

// Function to check whether a session is ongoing
async function checkSession() {
    try {
        const response = await fetch('http://localhost:5000/api/messages', {
            method: 'GET'
        });
    
        const data = await response.json();
        console.log(data);
        const messages = data.messages;
        
        if (messages.length === 0) {
            console.log('No ongoing session');
            return;
        }
        
        console.log('Messages array: ', messages);
        
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
                    await typeOutText('gptOutput', 'User: \n' + message.content + '\n \n', 0.1, blockSize);
                    break;
                case 'assistant':
                    await typeOutText('gptOutput', 'Albin: \n' + message.content + '\n \n', 0.1, blockSize);
                    break;
                default:
                    console.error('Invalid role: ', message.role);
            }
        }
    } catch (error) {
        console.error('Error while checking session: ', error);
    }
}