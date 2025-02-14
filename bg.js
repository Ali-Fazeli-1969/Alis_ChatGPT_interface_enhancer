let chatContent = ""; // Stores latest chat content
let mainTabId = null; // Tracks the main tab ID

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "update_chat") {
        chatContent = message.content;
        mainTabId = sender.tab.id;

        // Get the mirror tab ID and inject the updated content
        chrome.storage.local.get("mirrorWindowId", (data) => {
            if (data.mirrorWindowId) {
                chrome.windows.get(data.mirrorWindowId, (win) => {
                    if (win) {
                        // Inject content into the blank mirror tab
                        chrome.scripting.executeScript({
                            target: { tabId: win.tabs[0].id },
                            func: (content) => {
                                document.body.innerHTML = content;
                            },
                            args: [chatContent]
                        });
                    }
                });
            }
        });
    }
});
