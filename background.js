// Background Service Worker for AI Debate Arena

let debateState = {
    isActive: false,
    arenaTabId: null,
    debater1: { platform: null, tabId: null },
    debater2: { platform: null, tabId: null }
};

chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: "arena/index.html" });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background received:", message);

    if (message.action === "REGISTER_ARENA") {
        debateState.arenaTabId = sender.tab.id;
        sendResponse({ status: "registered" });
        return;
    }

    if (message.action === "START_DEBATE") {
        // 1. Find tabs for requested platforms
        Promise.all([
            findTabForPlatform(message.debater1),
            findTabForPlatform(message.debater2)
        ]).then(([tab1, tab2]) => {
            if (!tab1 || !tab2) {
                sendResponse({
                    status: "error",
                    message: `Could not find tabs for ${!tab1 ? message.debater1 : ''} ${!tab2 ? message.debater2 : ''}`
                });
                return;
            }

            debateState.debater1 = { platform: message.debater1, tabId: tab1.id };
            debateState.debater2 = { platform: message.debater2, tabId: tab2.id };
            debateState.isActive = true;

            sendResponse({ status: "started", debater1: tab1.id, debater2: tab2.id });
        });
        return true; // async response
    }

    if (message.action === "SEND_TO_AI") {
        // Determine target tab
        let targetTabId = null;
        let contextPrefix = "";

        // Who is sending? If from Arena (Human), we send to Debater 1 first usually, or specified target?
        // Let's assume Arena manages the flow and specifies 'targetPlatform'
        const targetPlatform = message.targetPlatform;

        if (targetPlatform === debateState.debater1.platform) targetTabId = debateState.debater1.tabId;
        else if (targetPlatform === debateState.debater2.platform) targetTabId = debateState.debater2.tabId;

        if (!targetTabId) {
            sendResponse({ status: "error", message: "Target AI not connected" });
            return;
        }

        // Add context if provided (e.g. [Claude says]: ...)
        const fullPrompt = message.context ? `[${message.context}]: ${message.prompt}` : message.prompt;

        // Send to Content Script
        chrome.tabs.sendMessage(targetTabId, {
            action: "GENERATE_RESPONSE",
            prompt: fullPrompt
        }, (response) => {
            // Relay response back to Arena
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                chrome.tabs.sendMessage(debateState.arenaTabId, {
                    action: "AI_ERROR",
                    platform: targetPlatform,
                    error: chrome.runtime.lastError.message
                });
            } else {
                chrome.tabs.sendMessage(debateState.arenaTabId, {
                    action: "AI_RESPONSE",
                    platform: targetPlatform,
                    response: response ? response.response : "No response data"
                });
            }
        });

        sendResponse({ status: "sent" });
    }
});

async function findTabForPlatform(platform) {
    let urlPattern = "";
    if (platform === "chatgpt") urlPattern = "https://chatgpt.com/*";
    else if (platform === "claude") urlPattern = "https://claude.ai/*";
    else if (platform === "gemini") urlPattern = "https://gemini.google.com/*";

    const tabs = await chrome.tabs.query({ url: urlPattern });
    if (tabs.length > 0) return tabs[0]; // Return first match
    return null;
}
