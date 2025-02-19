browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "create_mirror") {
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
    } else if (message.type === "check_if_mirror_window") {
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
    } else if (message.type === "update_mirror_chat") {
		browser.storage.local.get("mirrorTabId", (result) => {
			browser.scripting.executeScript({
				target: { tabId: result.mirrorTabId },
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
		});
	}
});

browser.tabs.onRemoved.addListener(async (tabId) => {
	await browser.storage.local.get(
	["mainTabId", "mirrorTabId"],
		(result) => {
			if (result.mainTabId === tabId) {
				browser.storage.local.remove("mainTabId");
				browser.tabs.remove(result.mirrorTabId).catch(() => {
					return;
				});
				browser.storage.local.remove("mirrorTabId");
			} else if (result.mirrorTabId === tabId)
				browser.storage.local.remove("mirrorTabId");
		}
	);
});
