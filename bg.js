let storage;
let win;

browser.runtime.onMessage.addListener(async (message, sender) => {
	switch (message.type) {
		case "create_mirror":
			win = await browser.windows.create({
				url: message.chatUrl,
				type: "normal",
				width: 800,
				height: 600
			});
			await browser.storage.local.set({
				mirrorWindowId: win.id,
				mainTabId: sender.tab.id
			});
			break;

		case "check_if_mirror_window":
			win = await browser.windows.getCurrent();
			storage = await browser.storage.local.get(
							["mirrorWindowId", "mainTabId"]
					  );
			if (win.id === storage.mirrorWindowId) {
				await browser.storage.local.set({
					mirrorTabId: sender.tab.id
				});
				//await browser.tabs.sendMessage(
				//	storage.mainTabId,
				//	{ type: "mirror_tab_established" }
				//);
				return true;
			} else
				return false;
			break;

		case "check_if_mirror_tab_exists":
			try {
				storage = await browser.storage.local.get("mirrorTabId");
				await browser.tabs.get(storage.mirrorTabId);
				return true;
			} catch {
				return false;
			}
			break;

		case "update_mirror_chat":
			storage = await browser.storage.local.get("mirrorTabId");
			browser.scripting.executeScript({
				target: { tabId: storage.mirrorTabId },
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
			break;
	}
});

browser.tabs.onRemoved.addListener(async (tabId) => {
	result = await browser.storage.local.get(
				["mainTabId", "mirrorTabId"],
			 );
	const mainTabId = result.mainTabId;
	const mirrorTabId = result.mirrorTabId;
	if (
		typeof mainTabId === "undefined" ||
	    typeof mirrorTabId === "undefined"
	) return;
	else if (mainTabId === tabId) {
		await browser.tabs.remove(mirrorTabId);
		await browser.storage.local.remove(
			["mainTabId", "mirrorTabId", "mirrorWindowId"]
		);
	} else if (mirrorTabId === tabId) {
		await browser.tabs.sendMessage(
			mainTabId,
			{ type: "mirror_tab_closed" }
		);
		await browser.storage.local.remove("mirrorTabId");
	}
});
