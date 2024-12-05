function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const openButton = document.getElementById('openSidebarBtn');

    sidebar.classList.toggle('sidebar-hidden');
    openButton.classList.toggle('hidden');
}

async function typeOutText(elementID, text, speed) {
    const element = document.getElementById(elementID);
    for (let i = 0; i < text.length; i++) {
        setTimeout(() => {
            element.innerHTML += text[i];
        }, speed * i);
    }
}

async function sendMessage(userMessage) {
    console.log('User message: ', userMessage);
    await typeOutText('gptOutput', 'User: ' + userMessage + '\n \n', 5);

    const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage })
    });

    const data = await response.json();
    console.log(data);
    const dataToReturn = data.content;
    console.log(dataToReturn);
    return dataToReturn;
} 

async function handleMessage() {
    const userMessage = document.getElementById('userMessage').value;

    try {
        const assistantResponse = await sendMessage(userMessage);
        typeOutText('gptOutput', 'Albin: \n' + assistantResponse + '\n \n', 5);
    } catch (error) {
        console.error('Error while sending out message: ', error);
    }
}

async function endSession() {
    const response = await fetch('http://localhost:5000/api/end', {
        method: 'POST'
    });

    const data = await response.json();
    console.log(data);
}