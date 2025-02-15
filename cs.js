function sendChatUpdate() {
    let chatContainer =
		document.querySelector(
			"div[class^='flex flex-col text-sm']"
		);
    if (chatContainer) {
        let chatContent = chatContainer.innerHTML;
        browser.runtime.sendMessage({
			type: "update_chat",
			content: chatContent
		});
    }
}

document.addEventListener("keydown", function(event) {
	/*
	   When a window isn't maximized, prevent
	   the enter key from creating newlines
	   and instead make it act like a send button
	   like it's supposed to be
	*/
	if (document.activeElement.id
		=== "prompt-textarea") {
			if (event.key === "Enter" &&
				!event.shiftKey) {
					event.preventDefault();

					let sendButton = document.querySelector(
						"button[data-testid='send-button']"
					);
					if (sendButton) {
						sendButton.click();
					}
			}
	}
	else {
		if (event.key === "m") {
			browser.runtime.sendMessage({
				type: "create_mirror"
			});
		} else if (event.key === "u") {
			sendChatUpdate();
		}
	}
});
