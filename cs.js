let minimizedTopBarIsDisplayed = true;
const chatScrollElementSelector =
	'div[class^="flex h-full flex-col overflow-y-auto"]';
const chatContainerSelector = 'div[class="relative h-full"]';

function minimizedTopBarHider() {
	let minimizedTopBar =
		document.querySelector(
			'div[class^="draggable sticky top-0 z-10"]'
		);
	if (minimizedTopBarIsDisplayed) {
		minimizedTopBar.style.setProperty(
			'display', 'none', 'important'
		);
	} else {
		minimizedTopBar.style.removeProperty('display');
	}
	minimizedTopBarIsDisplayed = !minimizedTopBarIsDisplayed;
}

function sendChat(mirrorTabId) {
	let mainTabChatContent;
	try {
		mainTabChatContent =
			document.querySelector(chatContainerSelector).innerHTML;
	} catch {
		return;
	}

	let mainTabScrollPosition;
	let scrollElement =
		document.querySelector(chatScrollElementSelector);
	if (scrollElement)
		mainTabScrollPosition = scrollElement.scrollTop;

	browser.runtime.sendMessage({
		type: 'update_mirror_tab',
		mirrorTabId,
		mainTabChatContent,
		mainTabScrollPosition:
			document.querySelector(
				chatScrollElementSelector
			).scrollTop,
		chatScrollElementSelector
	});
}

async function sendChatToAll() {
	let storage =
		await browser.storage.local.get('mirrorTabIds');
	let mirrorTabIdsArray = storage.mirrorTabIds;
	if (!Array.isArray(mirrorTabIdsArray)) {
		return;
	}
	mirrorTabIdsArray.forEach((mirrorTabId) => {
		sendChat(mirrorTabId);
	});
}

browser.runtime.sendMessage({
	type: 'check_if_mirror_tab'
}).then((result) => {
	if (result) {
		const css = `
			button[class^="cursor-pointer absolute z-10 rounded-full"],
			div[class^="absolute bottom-0 right-full top-0"],
			div[class^="flex items-center"],
			form {
				display: none !important;
			}
			div[class^="overflow"], ${chatScrollElementSelector} {
				scrollbar-width: none !important;
				overflow: auto !important;
			}
		`;
		const style = document.createElement('style');
		style.textContent = css;
		document.head.appendChild(style);
	} else {
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
					case 't':
						minimizedTopBarHider();
						event.preventDefault();
						break;
					case '"':
						browser.runtime.sendMessage({
							type: 'set_mirror_tabs_scroll_position',
							mainTabScrollPosition:
								document.querySelector(
									chatScrollElementSelector
								).scrollTop,
							chatScrollElementSelector
						});
						event.preventDefault();
						break;
				}
			}
		});
	}
});
