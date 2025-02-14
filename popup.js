document.getElementById("createMirror").
	addEventListener("click", () => {
		chrome.windows.create({
			url: "https://chat.openai.com",
			type: "popup", // Use "normal" if you want a full window
			width: 800,
			height: 600
		});
	}
);
