let mirrorTabIdsArray;
let mainTabId;

browser.runtime.onMessage.addListener(async (message, sender) => {
	switch (message.type) {
		case 'create_mirror':
			win = await browser.windows.create({
				url: 'https://chatgpt.com',
				type: 'normal',
				width: 800,
				height: 600
			});
			storage = await browser.storage.local.get('mirrorTabIds');
			mirrorTabIdsArray = storage.mirrorTabIds || [];
			mirrorTabIdsArray.push(win.tabs[0].id);
			await browser.storage.local.set({
				mainTabId: sender.tab.id,
				mirrorTabIds: mirrorTabIdsArray
			});
			break;
		case 'check_if_mirror_tab':
			storage = await browser.storage.local.get('mirrorTabIds');
			if (storage.mirrorTabIds == null)
				return false;
			else {
				if (storage.mirrorTabIds.includes(sender.tab.id))
					return true;
				else
					return false;
			}
		case 'update_mirror_tab':
			browser.scripting.executeScript({
				target: { tabId: message.mirrorTabId },
				func: (
					mainTabChatContent,
					chatScrollElementSelector,
					mainTabScrollPosition
				) => {
					let scrollElement =
						document.querySelector(chatScrollElementSelector);
					if (scrollElement) {
						mirrorTabScrollPosition = scrollElement.scrollTop;
						document.body.innerHTML = mainTabChatContent;
						// the scroll element has to be selected again
						// after injection
						document.querySelector(chatScrollElementSelector).
							scrollTop = mirrorTabScrollPosition;
					} else {
						document.body.innerHTML = mainTabChatContent;
					}
				},
				args: [
					message.mainTabChatContent,
					message.chatScrollElementSelector,
					message.mainTabScrollPosition,
				]
			});
			break;
		case 'set_mirror_tabs_scroll_position':
			storage = await browser.storage.local.get(
						['mainTabId', 'mirrorTabIds'],
					  );
			mainTabId = storage.mainTabId;
			mirrorTabIdsArray = storage.mirrorTabIds;
			if (
				typeof mainTabId === 'undefined' ||
				!sender.tab.id === mainTabId ||
				!Array.isArray(mirrorTabIdsArray)
			)
				return;
			mirrorTabIdsArray.forEach((mirrorTabId) => {
				browser.scripting.executeScript({
					target: { tabId: mirrorTabId },
					func: (
						mainTabScrollPosition,
						chatScrollElementSelector
					) => {
						document.querySelector(chatScrollElementSelector).
							scrollTop = mainTabScrollPosition;
					},
					args: [
						message.mainTabScrollPosition,
						message.chatScrollElementSelector,
					]
				});
			});
			break;
	}
});

browser.tabs.onRemoved.addListener(async (tabId) => {
	storage = await browser.storage.local.get(
				['mainTabId', 'mirrorTabIds'],
			  );
	mainTabId = storage.mainTabId;
	mirrorTabIdsArray = storage.mirrorTabIds;
	if (
		typeof mainTabId === 'undefined' ||
		!Array.isArray(mirrorTabIdsArray)
	)
		return;
	else if (tabId === mainTabId) {
		for (let mirrorTabId of mirrorTabIdsArray)
			await browser.tabs.remove(mirrorTabId);
		await browser.storage.local.remove(
			['mainTabId', 'mirrorTabIds']
		);
	} else if (mirrorTabIdsArray.includes(tabId)) {
		mirrorTabIdsArray.forEach((mirrorTabId, index) => {
			if (tabId === mirrorTabId)
				mirrorTabIdsArray.splice(index, 1);
		});
		if (mirrorTabIdsArray.length == 0)
			await browser.storage.local.remove(
				['mainTabId', 'mirrorTabIds']
			);
		else
			await browser.storage.local.set({
				mirrorTabIds: mirrorTabIdsArray
			});
	}
});
