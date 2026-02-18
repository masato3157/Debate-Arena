// ChatGPT Adapter
console.log("AI Debate: ChatGPT Adapter Loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "CHECK_READY") {
        sendResponse({ status: "ready", platform: "chatgpt" });
        return true;
    }

    if (request.action === "GENERATE_RESPONSE") {
        generateResponse(request.prompt).then(response => {
            sendResponse({ status: "success", response: response });
        }).catch(error => {
            sendResponse({ status: "error", message: error.toString() });
        });
        return true; // Keep channel open for async response
    }
});

async function generateResponse(prompt) {
    // 1. Find input area
    const inputArea = document.querySelector('#prompt-textarea');
    if (!inputArea) throw new Error("ChatGPT input area not found");

    // 2. Set text (requires simulating input event for React/Frameworks)
    inputArea.innerHTML = `<p>${prompt}</p>`;
    inputArea.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait a bit for UI to update
    await new Promise(r => setTimeout(r, 500));

    // 3. Click send button
    const sendButton = document.querySelector('button[data-testid="send-button"]');
    if (!sendButton) throw new Error("Send button not found");
    sendButton.click();

    // 4. Wait for generation to complete
    await waitForGeneration();

    // 5. Get last response
    return getLastResponse();
}

async function waitForGeneration() {
    // Wait for the "Stop generating" button to appear and then disappear
    // Or wait for the send button to reappear

    // Simple check: wait until send button is visible again
    // Initial wait to let generation start
    await new Promise(r => setTimeout(r, 2000));

    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            const sendButton = document.querySelector('button[data-testid="send-button"]');
            // If send button exists and is not disabled (usually), generation is done
            if (sendButton) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 1000);
    });
}

function getLastResponse() {
    const responses = document.querySelectorAll('.markdown');
    if (responses.length === 0) return "No response found.";
    return responses[responses.length - 1].innerText;
}
