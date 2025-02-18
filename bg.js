browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "create_mirror") {
		browser.windows.create({
			url: message.chatUrl,
			type: "normal",
			width: 800,
			height: 600
		}).then((newWindow) => {
			browser.storage.local.set({
				mirrorWindowId: newWindow.id
			});
		});
    } else if (message.type === "get_window_id") {
		browser.windows.getCurrent().then((win) => {
			sendResponse({ windowId: win.id });
		});
		return true;
    } else if (message.type === "update_chat") {
		browser.storage.local.get(
			"mirrorWindowId"
		).then((result) => {
			browser.windows.get(
				result.mirrorWindowId,
				{ populate: true }
			).then((win) => {
				browser.scripting.executeScript({
					target: { tabId: win.tabs[0].id },
					func: (chatContent) => {
						const chatContainer = document.querySelector(
							"div[class*='@container/thread']"
						);
						const scrollElementName =
							"div[class='flex h-full flex-col overflow-y-auto']";
						let scrollElement =
							document.querySelector(scrollElementName);

						// save and restore the mirror tab
						// scroll position
						const scrollPosition = scrollElement.scrollTop;
						chatContainer.innerHTML = chatContent;
						scrollElement = document.querySelector(scrollElementName);
						scrollElement.scrollTop = scrollPosition;
					},
					args: [message.content]
				});
			}).catch(() => {
				return;
			});
		});
	}
});
