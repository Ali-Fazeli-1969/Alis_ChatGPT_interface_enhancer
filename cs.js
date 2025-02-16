function sendChatUpdate() {
	let chatContainer =
		document.querySelectorAll(
			"article"
		);
	let chatContent;
	let modifiedChatContainer =
		[...chatContainer].map(chat => {
			let clonedChat = chat.cloneNode(true);
			clonedChat.querySelectorAll(`
				span.katex-html,
				div[class='flex items-center'],
				div[class^='absolute bottom-0']
			`).forEach(
					(span) => { span.remove(); }
			);
			return clonedChat.innerHTML;
		});

	modifiedChatContainer.forEach((modifiedChat) => {
		chatContent = chatContent + modifiedChat;
	});

	browser.runtime.sendMessage({
		type: "update_chat",
		content: chatContent
	});
}

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
				type: "create_mirror"
			}).then(response => {
				sendChatUpdate();
			});
		} else if (event.key === "u") {
			sendChatUpdate();
		}
	}
});
