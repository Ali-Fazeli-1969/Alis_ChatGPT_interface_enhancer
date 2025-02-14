document.getElementById("createMirror").
	addEventListener("click", () => {
		browser.windows.create({
			url: "about:blank",
			type: "popup",
			width: 800,
			height: 600
		});
	} (newWindow) => {
		browser.storage.local.set({
			mirrorWindowId: newWindow.iid
		});
	}
);
