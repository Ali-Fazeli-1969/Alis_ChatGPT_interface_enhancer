browser.runtime.onMessage.addListener(async (message, sender) => {
	switch (message.type) {
		case "create_mirror":
			win = await browser.windows.create({
				url: "blank.html",
				type: "normal",
				width: 800,
				height: 600
			});
			await browser.storage.local.set({
				mirrorTabId: win.tabs[0].id,
				mainTabChatContent: message.chatContent
			});
			break;
	}
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
	if (changeInfo.status === "complete") {
		storage = await browser.storage.local.get(
					["mirrorTabId", "mainTabChatContent"]
				  );
		browser.scripting.executeScript({
			target: { tabId: storage.mirrorTabId },
			func: (mainTabChatContent) => {
				document.body.innerHTML = mainTabChatContent;
			},
			args: [storage.mainTabChatContent]
		});
	}
});
