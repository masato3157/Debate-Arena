// ChatGPT Adapter v0.8 (Ultimate Input Edition)
// 役割：ChatGPTの画面を操作し、内容を確実に入力して送信する
console.log("AI Debate: ChatGPT Adapter v0.8");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("ChatGPT v0.8: Action ->", request.action);

    if (request.action === "CHECK_READY") {
        sendResponse({ status: "ready", platform: "chatgpt", version: "0.8" });
        return true;
    }

    if (request.action === "GENERATE_RESPONSE") {
        console.log("ChatGPT v0.8: Task received. Length:", request.prompt.length);
        generateResponse(request.prompt, request.requestId)
            .then(() => {
                console.log("ChatGPT v0.8: Generation task finished successfully.");
                sendResponse({ status: "success" });
            })
            .catch(error => {
                console.error("ChatGPT v0.8: Error occurred:", error);
                sendResponse({ status: "error", message: error.toString() });
            });
        return true;
    }
});

async function generateResponse(prompt, requestId) {
    // 1. 入力欄の特定
    const inputArea = document.querySelector('#prompt-textarea');
    if (!inputArea) throw new Error("ChatGPTの入力欄(#prompt-textarea)が見つかりません。");

    // 2. 究極の入力ロジック
    console.log("ChatGPT v0.8: Attempting primary input via execCommand...");
    inputArea.focus();
    
    // a. 標準的な文字入力
    document.execCommand('insertText', false, prompt);
    
    // b. React等の内部状態への強制同期を試みる
    await sleep(200);
    if (!inputArea.innerText.includes(prompt.substring(0, 5))) {
        console.warn("ChatGPT v0.8: execCommand failed or partial, using direct injection.");
        inputArea.innerText = prompt;
    }

    // c. サイト側に「入力された」と確信させるためのイベント全発火
    console.log("ChatGPT v0.8: Dispatching mandatory input events...");
    const events = [
        new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: prompt }),
        new Event('change', { bubbles: true }),
        new Event('blur', { bubbles: true })
    ];
    events.forEach(ev => inputArea.dispatchEvent(ev));

    // 3. UIの反映を待つための十分な待機 (1.5秒)
    console.log("ChatGPT v0.8: Waiting for UI to stabilize (1500ms)...");
    await sleep(1500);

    // 4. 送信ボタンのクリック
    const sendButton = findSendButton();
    if (!sendButton) {
        throw new Error("送信ボタンが見つかりません。入力未検知により非活性化している可能性があります。");
    }

    if (sendButton.disabled) {
        console.warn("ChatGPT v0.8: Send button is disabled, attempting to force enable...");
        sendButton.disabled = false;
    }

    console.log("ChatGPT v0.8: Clicking send button...");
    sendButton.click();

    // 5. 完了待ちとリレー
    console.log("ChatGPT v0.8: Waiting for response completion...");
    const responseText = await waitForCompleteResponse();
    
    chrome.runtime.sendMessage({
        action: "DIRECT_RELAY_RESPONSE",
        platform: "chatgpt",
        response: responseText,
        requestId: requestId
    });
}

function findSendButton() {
    const selectors = [
        'button[data-testid="send-button"]',
        'button[aria-label="送信"]',
        'button[aria-label="Send prompt"]',
        'button:has(svg path[d*="M15.192"])',
        'button[data-testid*="send"]',
        'fieldset button:last-child'
    ];
    for (const sel of selectors) {
        const btn = document.querySelector(sel);
        if (btn) return btn;
    }
    return null;
}

async function waitForCompleteResponse() {
    const maxWait = 180000; // 3分間待機
    const start = Date.now();
    let lastText = "";
    let stableCount = 0;

    while (Date.now() - start < maxWait) {
        await sleep(2000);
        
        const currentText = getLatestAssistantResponse();
        const isGenerating = !!(document.querySelector('button[data-testid="stop-button"]') || 
                                document.querySelector('svg[class*="loading"]'));

        if (!isGenerating && currentText.length > 5) {
            if (currentText === lastText) {
                stableCount++;
                if (stableCount >= 2) return currentText;
            } else {
                stableCount = 0;
                lastText = currentText;
            }
        } else {
            stableCount = 0;
            // 未開始のまま長時間経過した場合はフォールバック
            if (!isGenerating && currentText.length === 0 && (Date.now() - start > 10000)) {
                console.log("ChatGPT v0.8: Still no content after 10s, checking buttons...");
            }
        }
    }
    return getLatestAssistantResponse() || "応答取得タイムアウト";
}

function getLatestAssistantResponse() {
    const assistantMsgs = document.querySelectorAll('[data-message-author-role="assistant"]');
    if (assistantMsgs.length > 0) {
        const last = assistantMsgs[assistantMsgs.length - 1];
        const markdown = last.querySelector('.markdown') || last;
        return markdown.innerText.trim();
    }
    return "";
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
