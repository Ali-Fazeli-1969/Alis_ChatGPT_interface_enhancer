browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	switch (message.type) {
		case "create_mirror":
			browser.windows.create({
				url: message.chatUrl,
				type: "normal",
				width: 800,
				height: 600
			}).then((newWindow) => {
				browser.storage.local.set({
					mirrorWindowId: newWindow.id,
					mainTabId: sender.tab.id
				});
			});
			break;

		case "check_if_mirror_window":
			browser.windows.getCurrent().then((win) => {
				browser.storage.local.get(
					["mirrorWindowId", "mainTabId"],
						(result) => {
						if (win.id === result.mirrorWindowId) {
							browser.storage.local.set(
								{ mirrorTabId: sender.tab.id }
							);
							browser.tabs.sendMessage(
								result.mainTabId,
								{ type: "mirror_tab_established" }
							);
							sendResponse({ success: true });
						}
				});
			});
			return true;
			break;

		case "check_if_mirror_tab_exist":
			browser.storage.local.get("mirrorTabId", (result) => {
				browser.tabs.get(result.mirrorTabId)
					.then(() => {
						sendResponse({ success: true });
					})
					.catch(() => {
						sendResponse({ success: false });
					});
			});
			return true;
			break;

		case "update_mirror_chat":
			browser.storage.local.get("mirrorTabId", (result) => {
				browser.scripting.executeScript({
					target: { tabId: result.mirrorTabId },
					func: (chatContent) => {
						const chatContainer = document.querySelector(
							"div[class*='@container/thread']"
						);
						const scrollElementName =
							"div[class^='flex h-full flex-col overflow-y-auto']";
						let scrollElement =
							document.querySelector(scrollElementName);
						if (!scrollElement) {
							console.error("scrollElement not found");
							return false;
						}

						// save and restore the mirror tab
						// scroll position
						const scrollPosition = scrollElement.scrollTop;
						chatContainer.innerHTML = chatContent;
						scrollElement = document.querySelector(scrollElementName);
						scrollElement.scrollTop = scrollPosition;
					},
					args: [message.content]
				});
			});
			break;
	}
});

browser.tabs.onRemoved.addListener(async (tabId) => {
	await browser.storage.local.get(
	["mainTabId", "mirrorTabId"],
		(result) => {
			if (result.mainTabId === tabId) {
				browser.tabs.remove(result.mirrorTabId);
				browser.storage.local.remove(
					["mainTabId", "mirrorTabId"]
				);
			} else if (result.mirrorTabId === tabId)
				browser.tabs.sendMessage(
					result.mainTabId,
					{ type: "mirror_tab_closed" }
				);
				browser.storage.local.remove("mirrorTabId");
		}
	);
});
