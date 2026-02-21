// Gemini Adapter v0.8 (Ultimate Input Edition)
// 役割：Geminiの画面を操作し、内容を確実に入力して送信する
console.log("AI Debate: Gemini Adapter v0.8");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Gemini v0.8: Action ->", request.action);

    if (request.action === "CHECK_READY") {
        sendResponse({ status: "ready", platform: "gemini", version: "0.8" });
        return true;
    }

    if (request.action === "GENERATE_RESPONSE") {
        console.log("Gemini v0.8: Task received. Length:", request.prompt.length);
        generateResponse(request.prompt, request.requestId)
            .then(() => {
                console.log("Gemini v0.8: Generation task finished successfully.");
                sendResponse({ status: "success" });
            })
            .catch(error => {
                console.error("Gemini v0.8: Error occurred:", error);
                sendResponse({ status: "error", message: error.toString() });
            });
        return true;
    }
});

async function generateResponse(prompt, requestId) {
    // 1. 入力欄の特定
    const inputArea = document.querySelector('.ql-editor') || 
                      document.querySelector('div[contenteditable="true"]') ||
                      document.querySelector('rich-textarea div[contenteditable]');
    
    if (!inputArea) throw new Error("Geminiの入力欄が見つかりません。");

    // 2. 究極の入力ロジック
    console.log("Gemini v0.8: Inserting text...");
    inputArea.focus();
    
    // a. 標準入力
    document.execCommand('insertText', false, prompt);
    
    // b. フォールバック
    await sleep(200);
    if (!inputArea.innerText.includes(prompt.substring(0, 5))) {
        console.warn("Gemini v0.8: Using direct innerText injection.");
        inputArea.innerText = prompt;
    }

    // c. イベント発火
    ['input', 'change', 'blur'].forEach(name => {
        inputArea.dispatchEvent(new Event(name, { bubbles: true }));
    });

    // 3. 待機 (1.5秒)
    console.log("Gemini v0.8: Waiting for UI to stabilize (1500ms)...");
    await sleep(1500);

    // 4. 送信ボタン
    const sendButton = findSendButton();
    if (!sendButton) throw new Error("Geminiの送信ボタンが見つかりません。");

    console.log("Gemini v0.8: Clicking send button...");
    sendButton.click();

    // 5. 完了待ちとリレー
    const responseText = await waitForCompleteResponse();
    
    chrome.runtime.sendMessage({
        action: "DIRECT_RELAY_RESPONSE",
        platform: "gemini",
        response: responseText,
        requestId: requestId
    });
}

function findSendButton() {
    const selectors = [
        'button[aria-label="メッセージを送信"]',
        'button[aria-label="Send message"]',
        'button[aria-label="送信"]',
        '.send-button-container button',
        'button[mattooltip*="送信"]'
    ];
    for (const sel of selectors) {
        const btn = document.querySelector(sel);
        if (btn) return btn;
    }
    return null;
}

async function waitForCompleteResponse() {
    const maxWait = 180000;
    const start = Date.now();
    let lastText = "";
    let stableCount = 0;

    while (Date.now() - start < maxWait) {
        await sleep(2000);
        const currentText = getCleanResponse();
        const isGenerating = !!(document.querySelector('button[aria-label="Stop"]') || 
                                document.querySelector('.loading-indicator'));

        if (!isGenerating && currentText.length > 10) {
            if (currentText === lastText) {
                stableCount++;
                if (stableCount >= 2) return currentText;
            } else {
                stableCount = 0;
                lastText = currentText;
            }
        } else {
            stableCount = 0;
        }
    }
    return getCleanResponse();
}

function getCleanResponse() {
    const els = document.querySelectorAll('.model-response-text');
    if (els.length === 0) return "";
    const last = els[els.length - 1].cloneNode(true);
    // UIノイズ除去
    last.querySelectorAll('button, .action-buttons, .draft-selector, [class*="action"]').forEach(el => el.remove());
    return last.innerText.trim();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
