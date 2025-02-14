// Function to send chat updates from the main tab
function sendChatUpdate() {
    let chatContainer =
		document.querySelector(".text-base");
    if (chatContainer) {
        let chatContent = chatContainer.innerHTML;
        chrome.runtime.sendMessage(
			{
				type: "update_chat",
				content: chatContent
			}
		);
    }
}

// Function to receive updates in mirror tabs
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "mirror_update") {
        let chatContainer =
			document.querySelector(".text-base");
        if (chatContainer) {
            chatContainer.innerHTML = message.content;
        }
    }
});

// Only start sending updates if this is the main tab
setInterval(sendChatUpdate, 10000);
