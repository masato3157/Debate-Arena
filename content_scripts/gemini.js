// Gemini Adapter
console.log("AI Debate: Gemini Adapter Loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "CHECK_READY") {
        sendResponse({ status: "ready", platform: "gemini" });
        return true;
    }

    if (request.action === "GENERATE_RESPONSE") {
        generateResponse(request.prompt).then(response => {
            sendResponse({ status: "success", response: response });
        }).catch(error => {
            sendResponse({ status: "error", message: error.toString() });
        });
        return true;
    }
});

async function generateResponse(prompt) {
    // 1. Find input
    const inputArea = document.querySelector('div[contenteditable="true"]');
    // Gemini's input is often a rich textarea
    if (!inputArea) throw new Error("Gemini input area not found");

    // 2. Set text
    inputArea.innerText = prompt;
    inputArea.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(r => setTimeout(r, 500));

    // 3. Send
    const sendButton = document.querySelector('.send-button') || document.querySelector('button[aria-label="Send message"]');
    if (sendButton) {
        sendButton.click();
    } else {
        // Enter key fallback
        const enterEvent = new KeyboardEvent('keydown', {
            bubbles: true, cancelable: true, keyCode: 13, key: 'Enter'
        });
        inputArea.dispatchEvent(enterEvent);
    }

    // 4. Wait
    await waitForGeneration();

    // 5. Get response
    return getLastResponse();
}

async function waitForGeneration() {
    await new Promise(r => setTimeout(r, 2000));
    // Wait until "Response 1" etc handles are done or send button reappears
    return new Promise((resolve) => {
        setTimeout(resolve, 5000); // Temporary fixed wait for prototype
    });
}

function getLastResponse() {
    const responses = document.querySelectorAll('model-response');
    // Gemini tag names might be different
    if (responses.length === 0) {
        // Try selecting by class or attribute
        const chunks = document.querySelectorAll('.model-response-text'); // Guess
        if (chunks.length > 0) return chunks[chunks.length - 1].innerText;
        return "No response found (Selector update needed).";
    }
    return responses[responses.length - 1].innerText;
}
