// Arena Script v1.5b
console.log("Arena Script Loaded v1.5b");

const debater1Select = document.getElementById('debater1');
const debater2Select = document.getElementById('debater2');
const restartBtn = document.getElementById('restart-btn');
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let currentTurn = 'human';

// 重複表示防止用のリクエストID管理
const processedRequests = new Set();

// 利用可能なプラットフォームのリストを更新
async function updateAvailablePlatforms() {
    chrome.runtime.sendMessage({ action: "GET_AVAILABLE_PLATFORMS" }, (response) => {
        if (response && response.platforms) {
            console.log("Available platforms:", response.platforms);
            
            // 現在の選択を記憶
            const prev1 = debater1Select.value;
            const prev2 = debater2Select.value;
            
            // ドロップダウンをクリア
            debater1Select.innerHTML = '';
            debater2Select.innerHTML = '';
            
            if (response.platforms.length === 0) {
                const opt = new Option("AIタブを開いてください", "");
                debater1Select.add(opt.cloneNode(true));
                debater2Select.add(opt.cloneNode(true));
                return;
            }

            response.platforms.forEach(p => {
                const name = getName(p);
                debater1Select.add(new Option(name, p));
                debater2Select.add(new Option(name, p));
            });

            // 可能な限り以前の選択を復元
            if (response.platforms.includes(prev1)) debater1Select.value = prev1;
            if (response.platforms.includes(prev2)) debater2Select.value = prev2;
            else if (response.platforms.length > 1 && debater1Select.value === response.platforms[0]) {
                debater2Select.value = response.platforms[1];
            }
        }
    });
}

// 背景プログラムにアリーナの存在を登録 & 初期プラットフォーム取得
chrome.runtime.sendMessage({ action: "REGISTER_ARENA" }, (resp) => {
    console.log("Arena registered:", resp);
    updateAvailablePlatforms();
});

// 10秒ごとにタブ状況を確認して更新
setInterval(updateAvailablePlatforms, 10000);

// 背景プログラムからのメッセージ（AI応答）を受信
chrome.runtime.onMessage.addListener((message) => {
    console.log("Arena received message:", message.action);
    
    if (message.action === "AI_RESPONSE") {
        const reqId = message.requestId || 'no-id';
        const key = `${message.platform}-${reqId}`;
        
        if (reqId !== 'no-id' && processedRequests.has(key)) {
            console.log(`Duplicate response ignored for ${key}`);
            return;
        }
        if (reqId !== 'no-id') processedRequests.add(key);

        console.log(`Arena: Displaying response from ${message.platform}, length: ${message.response.length}`);
        addMessage(message.platform, message.response);

        // 自動リレー：片方のAIの回答を、もう片方に送る
        setTimeout(() => {
            if (message.platform === debater1Select.value) {
                sendToAI(debater2Select.value, message.response, `Debate opponent (${getName(debater1Select.value)}) said`);
            } else if (message.platform === debater2Select.value) {
                sendToAI(debater1Select.value, message.response, `Debate opponent (${getName(debater2Select.value)}) said`);
            }
        }, 1000); // 1秒で次のAIへリレー
    }

    if (message.action === "AI_ERROR") {
        console.log("Arena: Error received:", message.error);
        addMessage('system', `Error from ${getName(message.platform)}: ${message.error}`);
    }
});

// 「New Debate」ボタン
restartBtn.addEventListener('click', () => {
    chatContainer.innerHTML = '';
});

// 「Send」ボタン
sendBtn.addEventListener('click', () => {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage('human', text);
    userInput.value = '';

    const d1 = debater1Select.value;
    const d2 = debater2Select.value;

    // 両方のAIに最初のメッセージを送る（議題を把握させる）
    sendToAI(d1, text, "From Human Moderator");
    
    // 同じAIが選ばれていない場合のみ、もう一方にも送る
    if (d1 !== d2) {
        sendToAI(d2, text, "From Human Moderator");
    }
});

function sendToAI(platform, prompt, context) {
    // IDの一意性を強化（ミリ秒 + ランダム文字列）
    const requestId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5);
    console.log(`Arena v0.8: Requesting SEND_TO_AI to ${platform}, RID: ${requestId}, Length: ${prompt.length}`);
    
    // 直前のシステムメッセージと同じなら追記しない
    const lastMsg = chatContainer.lastElementChild;
    const statusText = `[System] ${getName(platform)} に送信を依頼しました...`;
    
    if (!lastMsg || !lastMsg.innerText.includes(statusText)) {
        addMessage('system', statusText);
    }
    
    chrome.runtime.sendMessage({
        action: "SEND_TO_AI",
        targetPlatform: platform,
        prompt: prompt,
        context: context,
        requestId: requestId
    }, (response) => {
        console.log(`Arena v0.8: BG Response for ${requestId}:`, response);
    });
}

function addMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;

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
    if (value === 'system') return 'System';
    return value;
}
