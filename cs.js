document.addEventListener("keydown", function(event) {
	if (event.key === "m") {
		if (document.activeElement.id
			=== "prompt-textarea") return
		browser.runtime.sendMessage({
			type: "create_mirror"
		});
	}
});

// Function to detect chat updates
function sendChatUpdate() {
    let chatContainer =
		document.querySelector(".text-base"); // Modify selector if needed
    if (chatContainer) {
        let chatContent = chatContainer.innerHTML;
        browser.runtime.sendMessage({
			type: "update_chat",
			content: chatContent
		});
    }
}

setInterval(sendChatUpdate, 10000);
