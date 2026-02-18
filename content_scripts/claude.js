// Claude Adapter
console.log("AI Debate: Claude Adapter Loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "CHECK_READY") {
        sendResponse({ status: "ready", platform: "claude" });
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
    // 1. Find input area
    // Claude usually uses a contenteditable div
    const inputArea = document.querySelector('div[contenteditable="true"]');
    if (!inputArea) throw new Error("Claude input area not found");

    // 2. Set text
    inputArea.innerText = prompt;
    inputArea.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(r => setTimeout(r, 500));

    // 3. Click send button
    // Look for button with aria-label usually
    const sendButton = document.querySelector('button[aria-label="Send Message"]') || document.querySelector('button[aria-label="Send"]');

    // Sometimes Claude requires Focus
    inputArea.focus();

    if (sendButton) {
        sendButton.click();
    } else {
        // Try hitting Enter?
        const enterEvent = new KeyboardEvent('keydown', {
            bubbles: true, cancelable: true, keyCode: 13, key: 'Enter'
        });
        inputArea.dispatchEvent(enterEvent);
    }

    // 4. Wait for generation
    await waitForGeneration();

    // 5. Get response
    return getLastResponse();
}

async function waitForGeneration() {
    await new Promise(r => setTimeout(r, 2000));

    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            // Claude usually provides some indication of "Thinking" or stops "Thinking"
            // We can check if the input area is back and usable
            // Or check specifically for the lack of "Stop" button if implemented

            // Strategy: text length of the last message stops changing for X seconds?
            // Or simply wait for input availability
            const inputArea = document.querySelector('div[contenteditable="true"]');
            if (inputArea) {
                // Claude keeps input area but maybe disabled? 
                // Let's assume if we can find the send button again (or if it's not disabled)
                // Rough heuristic
                resolve();
                clearInterval(checkInterval);
            }
        }, 1000);
    });
}

function getLastResponse() {
    // Claude's messages usually have a specific class
    // This selector is a guess and needs verification
    const messages = document.querySelectorAll('.font-claude-message');
    if (messages.length === 0) {
        // Fallback
        const allDivs = document.querySelectorAll('div.grid');
        return "Response element selector needs verification.";
    }
    return messages[messages.length - 1].innerText;
}
