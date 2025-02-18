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


browser.storage.local.get("mirrorWindowId", (data) => {
	if (!data.mirrorWindowId) return;

	browser.runtime.sendMessage({
		type: "get_window_id"
	}).then((response) => {
		if(response.windowId === data.mirrorWindowId) {
			chTopBarState();
			chFormFieldState();
		}
	});
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

			let sendButton = document.querySelector(
				"button[data-testid='send-button']"
			);
			if (sendButton) {
				sendButton.click();
			}
		}
	} else {
		if (event.key === "m") {
			browser.runtime.sendMessage({
				type: "create_mirror",
				chatUrl: window.location.href
			});
		} else if (event.key === "t") {
			chTopBarState();
		}
	}
});
