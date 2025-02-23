let storage;
let win;
let mirrorTabIdsArray;

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
					document.body.innerHTML = chatContent;
				},
				args: [message.content]
			});
			break;
	}
});

browser.tabs.onRemoved.addListener(async (tabId) => {
	storage = await browser.storage.local.get(
				["mainTabId", "mirrorTabIds"],
			  );
	const mainTabId = storage.mainTabId;
	mirrorTabIdsArray = storage.mirrorTabIds;
	if (
		!Array.isArray(mirrorTabIdsArray) ||
		typeof mainTabId === "undefined"
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
