// Arena Script
console.log("Arena Script Loaded");

const debater1Select = document.getElementById('debater1');
const debater2Select = document.getElementById('debater2');
const restartBtn = document.getElementById('restart-btn');
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let currentTurn = 'human'; // human, debater1, debater2
let debater1Name = 'ChatGPT';
let debater2Name = 'Claude';

// Register with background
chrome.runtime.sendMessage({ action: "REGISTER_ARENA" });

// Listen for messages from Background (AI Responses)
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "AI_RESPONSE") {
        addMessage(message.platform, message.response);

        // Auto-relay logic (Simplistic: Ping-Pong)
        // If Debater 1 answered, send to Debater 2
        // IF we are in "Auto Debate" mode. For now, let's make it automatic after Human starts it.

        // Wait a bit before replying
        setTimeout(() => {
            if (message.platform === debater1Select.value) {
                // Debater 1 finished, send to Debater 2
                sendToAI(debater2Select.value, message.response, `From ${getName(debater1Select.value)}`);
            } else if (message.platform === debater2Select.value) {
                // Debater 2 finished, send to Debater 1
                sendToAI(debater1Select.value, message.response, `From ${getName(debater2Select.value)}`);
            }
        }, 5000); // 5 seconds reading time
    }

    if (message.action === "AI_ERROR") {
        addMessage('system', `Error from ${message.platform}: ${message.error}`);
    }
});

restartBtn.addEventListener('click', () => {
    initDebate();
});

sendBtn.addEventListener('click', () => {
    const text = userInput.value.trim();
    if (!text) return;

    // Human speaks
    addMessage('human', text);
    userInput.value = '';

    // Send to Debater 1 to kick off
    // Or send to BOTH? Usually start with 1.
    sendToAI(debater1Select.value, text, "From Human Moderator");
});

function initDebate() {
    chrome.runtime.sendMessage({
        action: "START_DEBATE",
        debater1: debater1Select.value,
        debater2: debater2Select.value
    }, (response) => {
        if (response.status === "error") {
            alert(response.message + "\nPlease open the tabs for the selected AIs first.");
        } else {
            addMessage('system', `Debate Initialized: ${getName(debater1Select.value)} vs ${getName(debater2Select.value)}`);
            chatContainer.innerHTML = ''; // Clear chat
        }
    });
}

function sendToAI(platform, prompt, context) {
    addMessage('system', `Sending to ${getName(platform)}...`);
    chrome.runtime.sendMessage({
        action: "SEND_TO_AI",
        targetPlatform: platform,
        prompt: prompt,
        context: context
    });
}

function addMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;

    // Map sender to proper CSS class if raw platform name
    if (sender === debater1Select.value) msgDiv.classList.add(sender);
    if (sender === debater2Select.value) msgDiv.classList.add(sender);

    const metaDiv = document.createElement('div');
    metaDiv.className = 'message-meta';
    metaDiv.innerText = getName(sender);

    msgDiv.appendChild(metaDiv);
    msgDiv.appendChild(document.createTextNode(text));

    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function getName(value) {
    if (value === 'chatgpt') return 'ChatGPT';
    if (value === 'claude') return 'Claude';
    if (value === 'gemini') return 'Gemini';
    if (value === 'human') return 'Human';
    return value;
}
