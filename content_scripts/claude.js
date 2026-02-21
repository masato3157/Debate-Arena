// Claude Adapter v0.8 (Ultimate Input Edition)
// 役割：Claudeの画面を操作し、内容を確実に入力して送信する
console.log("AI Debate: Claude Adapter v0.8");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Claude v0.8: Action ->", request.action);

    if (request.action === "CHECK_READY") {
        sendResponse({ status: "ready", platform: "claude", version: "0.8" });
        return true;
    }

    if (request.action === "GENERATE_RESPONSE") {
        console.log("Claude v0.8: Task received. Length:", request.prompt.length);
        generateResponse(request.prompt, request.requestId)
            .then(() => {
                console.log("Claude v0.8: Generation task finished successfully.");
                sendResponse({ status: "success" });
            })
            .catch(error => {
                console.error("Claude v0.8: Error occurred:", error);
                sendResponse({ status: "error", message: error.toString() });
            });
        return true;
    }
});

async function generateResponse(prompt, requestId) {
    // 1. 入力欄
    const inputArea = document.querySelector('.ql-editor') || 
                      document.querySelector('div[contenteditable="true"]') ||
                      document.querySelector('fieldset div[contenteditable]');
    
    if (!inputArea) throw new Error("Claudeの入力欄が見つかりません。");

    // 2. 究極の入力ロジック
    console.log("Claude v0.8: Inserting text...");
    inputArea.focus();
    
    document.execCommand('insertText', false, prompt);
    
    await sleep(200);
    if (!inputArea.innerText.includes(prompt.substring(0, 5))) {
        inputArea.innerText = prompt;
    }

    ['input', 'change', 'blur'].forEach(name => {
        inputArea.dispatchEvent(new Event(name, { bubbles: true }));
    });

    // 3. 待機 (1.5秒)
    console.log("Claude v0.8: Waiting for UI to stabilize (1500ms)...");
    await sleep(1500);

    // 4. 送信ボタン
    const sendButton = findSendButton();
    if (!sendButton) throw new Error("Claudeの送信ボタンが見つかりません。");

    console.log("Claude v0.8: Clicking send button...");
    sendButton.click();

    // 5. 完了待ちとリレー
    const responseText = await waitForCompleteResponse();
    
    chrome.runtime.sendMessage({
        action: "DIRECT_RELAY_RESPONSE",
        platform: "claude",
        response: responseText,
        requestId: requestId
    });
}

function findSendButton() {
    const selectors = [
        'button[aria-label="Send Message"]',
        'button[aria-label="送信"]',
        'fieldset button:has(svg)',
        'button:has(svg path[d*="M12 3"])', // Claudeの送信アイコンの傾向
        'button.send-padding'
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
        const isGenerating = !!(document.querySelector('button[aria-label*="Stop"]') || 
                                document.querySelector('.stream-loading'));

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
    const els = document.querySelectorAll('.font-claude-message');
    if (els.length === 0) return "";
    
    const last = els[els.length - 1].cloneNode(true);
    // 思考要素を除去
    last.querySelectorAll('.font-claude-thought-message, button, .action-buttons').forEach(el => el.remove());
    
    let text = last.innerText.trim();
    // フォールバック: 「完了」「終了」などのキーワード以降が思考の場合のトリミング
    if (text.includes("完了") && text.length < 500) {
        text = text.split("完了").pop().trim();
    }
    return text;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
