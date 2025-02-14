// Function to detect chat updates
function sendChatUpdate() {
    let chatContainer =
		document.querySelector(".text-base"); // Modify selector if needed
    if (chatContainer) {
        let chatContent = chatContainer.innerHTML;
        chrome.runtime.sendMessage({
			type: "update_chat",
			content: chatContent
		});
    }
}

setInterval(sendChatUpdate, 10000);
