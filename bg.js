browser.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "create_mirror") {
		browser.windows.create({
			url: message.chatUrl,
			type: "normal",
			width: 800,
			height: 600
		}).then((newWindow) => {
			browser.windows.get(
				newWindow.id, { populate: true }
			).then((win) => {
				if (win) {
					let mirrorTabId = win.tabs[0].id;
					browser.scripting.insertCSS({
						target: { tabId: mirrorTabId },
						css: `
							div[class^="draggable sticky top-0"], form {
								display: none !important;
							}
						`
					});
				}
			});
		});
	}
});
