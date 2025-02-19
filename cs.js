let formFieldState = "none";
let topBarState = "none";

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
	/*
	   trying to send updates to the mirror
	   while typing into an input field causes
	   the typing to get stuck
	*/
	browser.runtime.sendMessage({
		type: "check_if_mirror_tab_exist"
	}).then(() => {
		//if (
		//	document.activeElement.localName === "input" ||
		//	document.activeElement.id === "prompt-textarea"
		//) return

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
		div[class^="absolute bottom-0 right-full top-0"] {
			display: none !important;
		}
	`);
}).catch(() => {
	return;
});

browser.runtime.onMessage.addListener((message) => {
	if (message.type === "mirror_tab_established")
		setInterval(sendChatUpdate, 10000);
});

document.addEventListener("keydown", function(event) {
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
	} else {
		switch (event.key) {
			case "m":
				browser.runtime.sendMessage({
					type: "create_mirror",
					chatUrl: window.location.href
				});
				break;
			case "t":
				chTopBarState();
				break;
			default:
				break;
		}
	}
});
