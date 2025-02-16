let topBarDisplayState = "block";

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
			})
		} else if (event.key === "u") {
			sendChatUpdate();
		} else if (event.key === "t") {
			topBarDisplayState =
				topBarDisplayState === "none" ? "block" : "none";

			document.querySelector(`
				div[class="absolute left-0 right-0"],
				div[class^="draggable no-draggable-children sticky top-0"],
				div[class^="draggable sticky top-0"]
			`).style.setProperty(
				"display", topBarDisplayState, "important"
			);
		}
	}
});
