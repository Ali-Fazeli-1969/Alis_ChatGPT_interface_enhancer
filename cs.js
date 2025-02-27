const scrollElementName =
	'div[class^="flex h-full flex-col overflow-y-auto"]';
const chatContainerSelector = 'div[class="relative h-full"]';

function sendChat(tabId) {
	browser.runtime.sendMessage({
		type: 'update_mirror_tab',
		mirrorTabId: tabId,
		mainTabChatContent:
			document.querySelector(chatContainerSelector).innerHTML
	});
}

async function sendChatToAll() {
	let storage =
		await browser.storage.local.get('mirrorTabIds');
	let mirrorTabIdsArray = storage.mirrorTabIds;
	if (!Array.isArray(mirrorTabIdsArray))
		return;
	mirrorTabIdsArray.forEach((mirrorTabId) => {
		sendChat(mirrorTabId);
	});
}

browser.runtime.onMessage.addListener((message) => {
	if (message.type === 'mirror_tab_ready')
		sendChat(message.mirrorTabId);
});

document.addEventListener('keydown', async (event) => {
	if (document.activeElement.localName === 'input')
		return

	/*
	   When a window isn't maximized, prevent
	   the enter key from creating newlines
	   and instead make it act like a send button
	   like it's supposed to be
	*/
	else if (document.activeElement.id === 'prompt-textarea') {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();

			const sendButton = document.querySelector(
				'button[data-testid="send-button"]'
			);
			if (sendButton) {
				sendChatToAll();
				sendButton.click();
			}
		} else if (event.key === 'Escape')
			document.activeElement.blur();
	} else {
		switch (event.key) {
			case 'M':
				await browser.runtime.sendMessage({
					type: 'create_mirror'
				});
				event.preventDefault();
				break;
			case 'u':
				sendChatToAll();
				event.preventDefault();
				break;
			case '"':
				let scrollElement =
					document.querySelector(scrollElementName);
				let maxScrollValue =
					scrollElement.scrollHeight - scrollElement.clientHeight;
				let scrollPercentage =
					Math.round((scrollElement.scrollTop * 100) / maxScrollValue);
				browser.runtime.sendMessage({
					type: 'set_mirror_tabs_scroll_position',
					mainTabScrollPercentage: scrollPercentage
				});
				event.preventDefault();
				break;
		}
	}
});

new MutationObserver(() => {
	if (document.querySelector(chatContainerSelector))
		sendChatToAll();
}).observe(
	document.querySelector('main'),
	{ childList: true, subtree: true }
);
