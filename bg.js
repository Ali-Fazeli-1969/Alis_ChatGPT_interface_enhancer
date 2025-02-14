let chatContent = ""; // Store the latest chat content
let mainTabId = null; // Track the main chat tab

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "update_chat") {
        chatContent = message.content;
        mainTabId = sender.tab.id; // Save the main chat tab ID

        // Send the updated content to all other tabs except the main one
        chrome.tabs.query(
			{
				url: [
					"*://chatgpt.com/*",
					"*://chat.openai.com/*"
				]
			},
			(tabs) => {
				tabs.forEach(tab => {
					if (tab.id !== mainTabId) {
						chrome.tabs.sendMessage(tab.id,
							{
								type: "mirror_update",
								content: chatContent
							}
						);
					}
				});
			}
		);
    }
});
