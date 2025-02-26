let mirrorTabIdsArray;
let mainTabId;

browser.runtime.onMessage.addListener(async (message, sender) => {
	switch (message.type) {
		case "create_mirror":
			win = await browser.windows.create({
				url: "blank.html",
				type: "normal",
				width: 800,
				height: 600
			});
			storage = await browser.storage.local.get("mirrorTabIds");
			mirrorTabIdsArray = storage.mirrorTabIds || [];
			mirrorTabIdsArray.push(win.tabs[0].id);
			await browser.storage.local.set({
				mainTabId: sender.tab.id,
				mirrorTabIds: mirrorTabIdsArray
			});
			break;
		case "update_mirror_tab":
			browser.scripting.executeScript({
				target: { tabId: message.mirrorTabId },
				func: (mainTabChatContent) => {
					document.body.innerHTML = mainTabChatContent;
				},
				args: [message.mainTabChatContent]
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
				browser.scripting.executeScript({
					target: { tabId: mirrorTabId },
					func: (mainTabScrollPosition) => {
						document.querySelector('html').scrollTop
							= mainTabScrollPosition;
					},
					args: [message.mainTabScrollPosition]
				});
			});
			break;
	}
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
	storage = await browser.storage.local.get(
				['mainTabId', 'mirrorTabIds']
			  );
	mainTabId = storage.mainTabId;
	mirrorTabIdsArray = storage.mirrorTabIds;
	if (
		typeof mainTabId === "undefined" ||
		!Array.isArray(mirrorTabIdsArray) ||
		tabId == mainTabId ||
		!mirrorTabIdsArray.includes(tabId)
	)
		return;
	if (changeInfo.status === "complete") {
		browser.tabs.sendMessage(
			storage.mainTabId,
			{
				type: "mirror_tab_ready",
				mirrorTabId: tabId
			}
		);
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
			["mainTabId", "mirrorTabIds"]
		);
	} else if (mirrorTabIdsArray.includes(tabId)) {
		mirrorTabIdsArray.forEach((mirrorTabId, index) => {
			if (tabId === mirrorTabId)
				mirrorTabIdsArray.splice(index, 1);
		});
		if (mirrorTabIdsArray.length == 0)
			await browser.storage.local.remove(
				["mainTabId", "mirrorTabIds"]
			);
		else
			await browser.storage.local.set({
				mirrorTabIds: mirrorTabIdsArray
			});
	}
});
