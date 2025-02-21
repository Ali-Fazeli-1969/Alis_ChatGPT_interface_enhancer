let intervalId;
let formFieldState = "none";
let topBarState = "none";
let markSet = false;
let markActivate = false;
const scrollElementName =
	"div[class^='flex h-full flex-col overflow-y-auto']";

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

function sendChatUpdate() {
	browser.runtime.sendMessage({
		type: "check_if_mirror_tab_exist"
	}).then(() => {
		browser.runtime.sendMessage({
			type: "update_mirror_chat",
			content: document.querySelector(
				"div[class*='@container/thread']"
			).innerHTML
		});
	}).catch(() => {
		return;
	});
}

browser.runtime.sendMessage({
	type: "check_if_mirror_window"
}).then(() => {
	chTopBarState();
	chFormFieldState();
	applyStyle(`
		div[class^="mb-2 flex"],
		button[class^="cursor-pointer absolute z-10 rounded-full"],
		div[class^="absolute bottom-0 right-full top-0"] {
			display: none !important;
		}
	`);
}).catch(() => {
	return;
});

browser.runtime.onMessage.addListener((message) => {
	if (message.type === "mirror_tab_established") {
		intervalId = setInterval(sendChatUpdate, 30000);
	} else if (message.type === "mirror_tab_closed")
		clearInterval(intervalId);
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
				sendChatUpdate();
				sendButton.click();
			}
		} else if (event.key === "Escape")
			document.activeElement.blur();

	} else if (markSet) {
		if (event.key.length > 1 ||
			event.key === ":"
		) {
			markSet = false;
			return;
		}

		let result =
			await browser.storage.local.get("marks");
		let marksArray = result.marks || [];

		marksArray.forEach((markLine, index) => {
			const markKey = markLine.split(":")[0];
			if (event.key === markKey)
				marksArray.splice(index, 1);
		});

		let scrollPosition =
			document.querySelector(scrollElementName).scrollTop;
		const line = `${event.key}:${scrollPosition}`;

		marksArray.push(line);
		await browser.storage.local.set({
			marks: marksArray
		});

		markSet = false;
		event.preventDefault();

	} else if (markActivate) {
		if (event.key.length > 1 ||
			event.key === ":"
		) {
			markActivate = false;
			return;
		}
		let result =
			await browser.storage.local.get("marks");
		let marksArray = result.marks || [];

		marksArray.forEach((markLine) => {
			const markKey = markLine.split(":")[0];
			if (event.key === markKey) {
				const markScrollPosition =
					markLine.split(":")[1];
				document.querySelector(scrollElementName)
					.scrollTop = markScrollPosition;
			}
		});
		markActivate = false;

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
				event.preventDefault();
				break;
			case "'":
				markActivate = true;
				event.preventDefault();
				break;
			case "u":
				sendChatUpdate();
				break;
			case "t":
				chTopBarState();
				break;
			default:
				break;
		}
	}
});
