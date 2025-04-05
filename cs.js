let isMirror;
let formHidden = false;
let keepShowingForm;
const scrollKeys = ['k', 'K', 'j', 'J'];
const chatScrollElementSelector =
	'div[class^="flex h-full flex-col overflow-y-auto"]';

function scrollArticle(direction) {
	const centerX = window.innerWidth / 2;
	const centerY = window.innerHeight / 2;
	const elementsAtCenter = document.elementsFromPoint(centerX, centerY);
	const currentArticle =
		elementsAtCenter.find(
			el =>
				el.tagName === 'ARTICLE'
		);

	const articles = Array.from(document.querySelectorAll('article'));
	const index = articles.indexOf(currentArticle);
	let targetIndex;
	if (index === 1) {
		if (direction === 'down')
			targetIndex = 2;
		else
			return;
	} else if (index === articles.length - 1) {
		if (direction === 'up')
			targetIndex = index - 2;
		else
			return;
	} else {
		const offset = direction === 'up' ? 2 : -2;
		targetIndex = index - offset;
	}
	let newArticle = articles[targetIndex];
	if (newArticle) {
		newArticle.scrollIntoView({
			behavior: 'auto',
			block: 'start'
		});
	}
}

function scrollHandler(key) {
	switch (key) {
		case 'K':
			scrollArticle('up');
			break;

		case 'J':
			scrollArticle('down');
			break;
	}
}

function applyStyle(css, id) {
	const style = document.createElement('style');
	if (id)
		style.id = id;
	style.textContent = css;
	document.head.appendChild(style);
}

function toggleFormVisibility(show) {
	let hideFormStyleTag =
		document.getElementById('hide-form');
	if (show) {
		if (hideFormStyleTag) {
			hideFormStyleTag.remove();
			formHidden = false;
		}
	} else {
		if (!hideFormStyleTag) {
			applyStyle(`
				form {
					display: none !important;
				}
			`, 'hide-form');
			formHidden = true;
		}
	}
}

function topBarHider() {
	let topBarStyleSheet =
		document.getElementById('minimized-top-bar-hide');
	if (topBarStyleSheet) {
		topBarStyleSheet.remove();
	} else {
		applyStyle(`
			div[class^='draggable'] {
				display: none !important;
			}
		`, 'minimized-top-bar-hide');
	}
}

function sendChat(mirrorTabId) {
	let mainTabChatContent;
	try {
		mainTabChatContent =
			document.querySelector('body').innerHTML;
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

async function main() {
	topBarHider();
	toggleFormVisibility(false);
	document.querySelectorAll('button').forEach((el) => {
		if (el.innerHTML === '?') {
			applyStyle(`
				button[class='${el.className}'] {
					display: none !important;
				}
			`);
		}
	});
	applyStyle(`
		button[class^='cursor-pointer absolute'] {
			display: none !important;
		}
	`);

	isMirrorTab = await browser.runtime.sendMessage({
					 type: 'check_if_mirror_tab'
				  });
	if (isMirrorTab) {
		applyStyle(`
			button[class^="cursor-pointer absolute z-10 rounded-full"],
			button[class^="rounded-lg text-token-text-secondary"],
			div[class^="absolute bottom-0 right-full top-0"],
			div[class^="flex items-center"],
			form {
				display: none !important;
			}
		`);
		document.addEventListener('keydown', (event) => {
			scrollHandler(event.key);
		});
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
					sendChatToAll();
					document.querySelector(
						'button[data-testid="send-button"]'
					).click();
					document.activeElement.blur();
				} else if (event.key === 'Escape')
					document.activeElement.blur();
			} else if (event.key === 'i') {
				if (!formHidden)
					return;
				document.getElementById('hide-form').remove();
				let form = document.querySelector('form');
				form.addEventListener('focusout', () => {
					setTimeout(() => {
						if (!form.contains(document.activeElement)) {
							toggleFormVisibility(false);
						}
					}, 0);
				});
			} else if (scrollKeys.includes(event.key))
				scrollHandler(event.key);
			else {
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

					case 'o':
						document.querySelector(
							'button[aria-label="New chat"]'
						).click();
						break;

					case 't':
						topBarHider();
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

					case 'I':
						toggleFormVisibility(formHidden);
						event.preventDefault();
						break;
				}
			}
		});
	}
}

main();
