let minimizedTopBarIsDisplayed = true;
const chatScrollElementSelector =
	'div[class^="flex h-full flex-col overflow-y-auto"]';
const chatContainerSelector = 'div[class="relative h-full"]';

function scroll(direction) {
	let scrollElement =
		document.querySelector(chatScrollElementSelector);
	direction === 'up' ?
		scrollElement.scrollTop += 50
			:
		scrollElement.scrollTop -= 50
	;
}

function applyStyle(css, id) {
	const style = document.createElement('style');
	if (id)
		style.id = id;
	style.textContent = css;
	document.head.appendChild(style);
}

function hideForm() {
	if (document.getElementById('hide-form'))
		return;
	applyStyle(`
		form {
			display: none !important;
		}
	`, 'hide-form');
}

function minimizedTopBarHider() {
	if (minimizedTopBarIsDisplayed) {
		applyStyle(`
			div[class^='draggable sticky top-0 z-10'] {
				display: none !important;
			}
		`, 'minimized-top-bar-hide');
	} else {
		document.getElementById('minimized-top-bar-hide').remove();
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
		document.queryselector(chatScrollElementSelector);
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
		applyStyle(`
			button[class^="cursor-pointer absolute z-10 rounded-full"],
			div[class^="absolute bottom-0 right-full top-0"],
			div[class^="flex items-center"],
			form {
				display: none !important;
			}
		`);
		document.addEventListener('keydown', async (event) => {
				switch (event.key) {
					case 'j':
						scroll('up');
						break;

					case 'k':
						scroll('down');
						break;
				}
		});
	} else {
		minimizedTopBarHider();
		hideForm();
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
					sendChatToAll();
					document.querySelector(
						'button[data-testid="send-button"]'
					).click();
				} else if (event.key === 'Escape')
					document.activeElement.blur();
			} else if (event.key === 'i') {
				document.getElementById('hide-form').remove();
				let form = document.querySelector('form');
				form.addEventListener('focusout', () => {
					setTimeout(() => {
						if (!form.contains(document.activeElement)) {
							hideForm();
						}
					}, 0);
				});
			} else {
				switch (event.key) {
					case 'j':
						scroll('up');
						break;

					case 'k':
						scroll('down');
						break;

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
						await sendChatToAll();
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
