let formFieldState = "none";
let topBarState = "none";
let markSet = false;
let markJump = false;
const scrollElementName =
	"div[class^='flex h-full flex-col overflow-y-auto']";
const chatContainerSelector =
	"div[class*='@container/thread']";

function applyStyle(style) {
	let styleSheet = document.createElement("style");
	styleSheet.textContent = style;
	document.head.appendChild(styleSheet);
}

function chTopBarState() {
	applyStyle(`
		div[class^="draggable sticky top-0 z-10"],
		div[class^="draggable no-draggable-children sticky top-0"] {
			display: ${topBarState} !important;
		}
	`);
	topBarState =
		topBarState === "none" ? "block" : "none";
}

function chFormFieldState() {
	applyStyle(`
		form {
			display: ${formFieldState} !important;
		}
	`);
	formFieldState =
		formFieldState === "none" ? "block" : "none";
}

async function markFunction(mode, event) {
	if (event.key.length > 1 || event.key === ":") {
		if (mode === "set") markSet = false;
		else if (mode === "jump") markJump = false;
		return;
	}

	const storage = await browser.storage.local.get("marks");
	let marksArray = storage.marks || [];
	const scrollElement = document.querySelector(scrollElementName);

	if (mode === "set") {
		/*
			if the key for the new mark has already
			been used, delete it
		*/
		marksArray.forEach((markLine, index) => {
			if (event.key === markLine.split(":")[0])
				marksArray.splice(index, 1);
		});

		marksArray.push(`${event.key}:${scrollElement.scrollTop}`);
		await browser.storage.local.set({
			marks: marksArray
		});
		markSet = false;
	} else if (mode === "jump") {
		marksArray.some((markLine) => {
			if (event.key === markLine.split(":")[0]) {
				scrollElement.scrollTop = markLine.split(":")[1];
				return true;
			}
		});
		markJump = false;
	}
}

function sendChat(tabId) {
	browser.runtime.sendMessage({
		type: "check_if_mirror_tab_exists",
		mirrorTabId: tabId
	}).then((response) => {
		if (!response) return;
		browser.runtime.sendMessage({
			type: "update_mirror_chat",
			mirrorTabId: tabId,
			content: document.body.innerHTML
		});
	});
}

async function sendChatToAll() {
	let storage =
		await browser.storage.local.get("mirrorTabIds");
	let mirrorTabIdsArray = storage.mirrorTabIds;
	if (!Array.isArray(mirrorTabIdsArray))
		return;
	mirrorTabIdsArray.forEach((mirrorTabId) => {
		sendChat(mirrorTabId);
	});
}

browser.runtime.sendMessage({
	type: "check_if_mirror_window"
}).then((response) => {
	if (!response) return;
	chTopBarState();
	chFormFieldState();
	applyStyle(`
		button[class^="cursor-pointer absolute z-10 rounded-full"],
		div[class^="inline-flex rounded-xl border border-gray-100"],
		div[class^="absolute bottom-0 right-full top-0"],
		div[class^="mb-2 flex"] {
			display: none !important;
		}
	`);
	window.addEventListener('load', () => {
		browser.runtime.sendMessage({
			type: "mirror_tab_ready"
		});
	});
	//new MutationObserver((mutations, obs) => {
	//	if (
	//		document.querySelector(chatContainerSelector) &&
	//		document.querySelector(scrollElementName)
	//	) {
	//		browser.runtime.sendMessage({
	//			type: "mirror_tab_ready"
	//		});
	//		obs.disconnect();
	//	}
	//}).observe(document.body, { childList: true, subtree: true });
});

browser.runtime.onMessage.addListener((message) => {
	if (message.type === "main_tab_send_chat")
		sendChat(message.mirrorTabId);
});

document.addEventListener("keydown", async (event) => {
	if (document.activeElement.localName === "input")
		return

	/*
	   When a window isn't maximized, prevent
	   the enter key from creating newlines
	   and instead make it act like a send button
	   like it's supposed to be
	*/
	else if (document.activeElement.id === "prompt-textarea") {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();

			const sendButton = document.querySelector(
				"button[data-testid='send-button']"
			);
			if (sendButton) {
				sendChatToAll();
				sendButton.click();
			}
		} else if (event.key === "Escape")
			document.activeElement.blur();
	} else if (markSet) {
		markFunction("set", event);
		event.preventDefault();
	} else if (markJump) {
		markFunction("jump", event);
		event.preventDefault();
	} else {
		switch (event.key) {
			case "M":
				browser.runtime.sendMessage({
					type: "create_mirror",
					chatUrl: window.location.href
				});
				break;
			case "m":
				markSet = true;
				break;
			case "'":
				markJump = true;
				break;
			case "u":
				sendChatToAll();
				break;
			case "t":
				chTopBarState();
				break;
		}
		event.preventDefault();

	}
});
