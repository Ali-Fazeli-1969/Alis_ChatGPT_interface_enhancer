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
	} else {
		switch (event.key) {
			case "M":
				let content = '';
				document.querySelectorAll('.text-message').forEach((element) => {
					content = content + element.innerHTML;
				});
				await browser.runtime.sendMessage({
					type: "create_mirror",
					chatUrl: window.location.href,
					chatContent: content
				});
				event.preventDefault();
				break;
		}

	}
});
