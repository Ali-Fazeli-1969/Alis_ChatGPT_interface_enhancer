// Stores latest chat content
let chatContent = "";
// Tracks the main tab ID
let mainTabId = null;

browser.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "update_chat") {
        chatContent = message.content;
        mainTabId = sender.tab.id;

        // Get the mirror tab ID
		// and inject the updated content
        browser.storage.local.get("mirrorWindowId", (data) => {
            if (data.mirrorWindowId) {
                browser.windows.get(
					data.mirrorWindowId, { populate: true }
				).then((win) => {
					if (win) {
						// Inject content into the blank mirror tab
						browser.scripting.executeScript({
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
    } else {
		browser.windows.create({
				url: "about:blank",
				type: "popup",
				width: 800,
				height: 600
		}).then((newWindow) => {
			browser.storage.local.set({
				mirrorWindowId: newWindow.id
			});
		});
	}
});
