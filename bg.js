let storage;
let win;
let mirrorTabIdsArray;
let mainTabId;

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
							["mirrorWindowId", "mainTabId", "mirrorTabIds"]
					  );
			if (win.id === storage.mirrorWindowId) {
				mirrorTabIdsArray = storage.mirrorTabIds || [];
				mirrorTabIdsArray.push(sender.tab.id);
				await browser.storage.local.set({
					mirrorTabIds: mirrorTabIdsArray
				});
				return true;
			} else
				return false;
			break;

		case "mirror_tab_ready":
			storage = await browser.storage.local.get("mainTabId");
			await browser.tabs.sendMessage(
				storage.mainTabId,
				{
					type: "main_tab_send_chat",
					mirrorTabId: sender.tab.id
				}
			);
			break;

		case "check_if_mirror_tab_exists":
			try {
				await browser.tabs.get(message.mirrorTabId);
				return true;
			} catch {
				return false;
			}
			break;

		case "update_mirror_chat":
			browser.scripting.executeScript({
				target: { tabId: message.mirrorTabId },
				func: (chatContent) => {
					const scrollElementName =
						"div[class^='flex h-full flex-col overflow-y-auto']";
					const scrollElement = document.querySelector(scrollElementName);
					if (scrollElement === null)
						document.body.innerHTML = chatContent;
					else {
						const scrollPosition = scrollElement.scrollTop;
						document.body.innerHTML = chatContent;
						document.querySelector(scrollElementName)
							.scrollTop = scrollPosition;
					}
				},
				args: [message.content]
			});
			break;

			case "set_mirror_tabs_scroll_position":
				storage = await browser.storage.local.get(
							["mainTabId", "mirrorTabIds"],
						  );
				mainTabId = storage.mainTabId;
				mirrorTabIdsArray = storage.mirrorTabIds;
				if (
					typeof mainTabId === "undefined" ||
					!sender.tab.id === mainTabId ||
					!Array.isArray(mirrorTabIdsArray)
				)
					return;
				mirrorTabIdsArray.forEach((mirrorTabId) => {
					browser.tabs.sendMessage(
						mirrorTabId,
						{
							type: "jump_to_main_tab_scroll_position",
							mainTabScrollPosition: message.scrollPosition
						}
					);
				});
				break;
	}
});

browser.tabs.onRemoved.addListener(async (tabId) => {
	storage = await browser.storage.local.get(
				["mainTabId", "mirrorTabIds"],
			  );
	mainTabId = storage.mainTabId;
	mirrorTabIdsArray = storage.mirrorTabIds;
	if (
		typeof mainTabId === "undefined" ||
		!Array.isArray(mirrorTabIdsArray)
	)
		return;
	else if (tabId === mainTabId) {
		for (let mirrorTabId of mirrorTabIdsArray)
			await browser.tabs.remove(mirrorTabId);
		await browser.storage.local.remove(
			["mainTabId", "mirrorTabIds", "mirrorWindowId"]
		);
	} else if (mirrorTabIdsArray.includes(tabId)) {
		mirrorTabIdsArray.forEach((mirrorTabId, index) => {
			if (tabId === mirrorTabId)
				mirrorTabIdsArray.splice(index, 1);
		});
		if (mirrorTabIdsArray.length == 0)
			await browser.storage.local.remove(
				["mainTabId", "mirrorTabIds", "mirrorWindowId"]
			);
		else
			await browser.storage.local.set({
				mirrorTabIds: mirrorTabIdsArray
			});
	}
});
