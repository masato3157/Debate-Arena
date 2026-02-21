// Background Service Worker v0.5 for AI Debate Arena
// 役割：アリーナとAIタブの間の通信を仲介する中央ハブ
// 注意：Service Workerはスリープする可能性があるため、
//       重要な状態は chrome.storage.session に保存する
console.log("AI Debate Background v0.5 Initialized");

// Service Workerがスリープから復帰しても arenaTabId を復元するためのヘルパー
async function getArenaTabId() {
    const data = await chrome.storage.session.get('arenaTabId');
    return data.arenaTabId || null;
}

async function setArenaTabId(tabId) {
    await chrome.storage.session.set({ arenaTabId: tabId });
    console.log("BG v0.5: arenaTabId saved:", tabId);
}

// 拡張機能アイコンクリック時にアリーナを開く
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: "arena/index.html" });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("BG v0.5 received:", message.action, "from tab:", sender.tab?.id);

    // アリーナの登録
    if (message.action === "REGISTER_ARENA") {
        setArenaTabId(sender.tab.id);
        sendResponse({ status: "registered" });
        return;
    }

    // 利用可能なプラットフォーム（開いているタブ）を返す
    if (message.action === "GET_AVAILABLE_PLATFORMS") {
        const platforms = [];
        const queries = [
            { id: "chatgpt", url: "https://chatgpt.com/*" },
            { id: "claude", url: "https://claude.ai/*" },
            { id: "gemini", url: "https://gemini.google.com/*" }
        ];

        Promise.all(queries.map(q => chrome.tabs.query({ url: q.url })))
            .then(results => {
                results.forEach((tabs, index) => {
                    if (tabs.length > 0) {
                        platforms.push(queries[index].id);
                    }
                });
                sendResponse({ platforms: platforms });
            });
        return true; // 非同期応答
    }

    // ChatGPTコンテンツスクリプトからの直接リレー
    if (message.action === "DIRECT_RELAY_RESPONSE") {
        console.log(`BG v0.5: Direct relay from ${message.platform}`);
        getArenaTabId().then(arenaTabId => {
            if (arenaTabId) {
                console.log(`BG v0.5: Forwarding to arena tab ${arenaTabId}`);
                chrome.tabs.sendMessage(arenaTabId, {
                    action: "AI_RESPONSE",
                    platform: message.platform,
                    response: message.response,
                    requestId: message.requestId
                });
            } else {
                console.warn("BG v0.5: arenaTabId is null, relay skipped.");
            }
        });
        return;
    }

    // AIへのメッセージ送信
    if (message.action === "SEND_TO_AI") {
        // 送信元をアリーナとして記録
        setArenaTabId(sender.tab.id);

        const targetPlatform = message.targetPlatform;
        const requestId = message.requestId;
        const fullPrompt = message.context
            ? `[${message.context}]: ${message.prompt}`
            : message.prompt;

        console.log(`BG v0.5: SEND_TO_AI → ${targetPlatform}, RID: ${requestId}`);

        // 毎回タブを検索する方式
        findTabForPlatform(targetPlatform).then(async tab => {
            const arenaTabId = await getArenaTabId();

            if (!tab) {
                // タブが開いていないAIへの送信は静かにスキップ
                console.warn(`BG v0.5: Tab not found for ${targetPlatform} (skipped)`);
                return;
            }

            console.log(`BG v0.8: Sending GENERATE_RESPONSE to ${targetPlatform} (Tab: ${tab.id})`);

            chrome.tabs.sendMessage(tab.id, {
                action: "GENERATE_RESPONSE",
                prompt: fullPrompt,
                requestId: requestId
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error(`BG v0.8: ERROR sending to ${targetPlatform}:`, chrome.runtime.lastError.message);
                    getArenaTabId().then(aid => {
                        if (aid) {
                            chrome.tabs.sendMessage(aid, {
                                action: "AI_ERROR",
                                platform: targetPlatform,
                                error: `通信エラー: ${chrome.runtime.lastError.message}`
                            });
                        }
                    });
                } else if (response && response.status === "success") {
                    console.log(`BG v0.8: SUCCESS confirmed for ${targetPlatform}`);
                } else if (response && response.status === "error") {
                    console.error(`BG v0.8: AI_ERROR from ${targetPlatform}:`, response.message);
                    getArenaTabId().then(aid => {
                        if (aid) {
                            chrome.tabs.sendMessage(aid, {
                                action: "AI_ERROR",
                                platform: targetPlatform,
                                error: response.message
                            });
                        }
                    });
                }
            });
        });

        sendResponse({ status: "sent_to_bg" });
        return true;
    }
});

async function findTabForPlatform(platform) {
    let urlPattern = "";
    if (platform === "chatgpt") urlPattern = "https://chatgpt.com/*";
    else if (platform === "claude") urlPattern = "https://claude.ai/*";
    else if (platform === "gemini") urlPattern = "https://gemini.google.com/*";

    const tabs = await chrome.tabs.query({ url: urlPattern });
    console.log(`BG v0.8: Active tabs for ${platform}: ${tabs.length}`);
    return tabs.length > 0 ? tabs[0] : null;
}
