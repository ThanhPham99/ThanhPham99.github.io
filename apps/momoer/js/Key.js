(function (exports) {
	const isMobile = /Android|BlackBerry|iPhone|iPad|iPod|IEMobile|WPDesktop|Opera Mini/i.test(navigator.userAgent);
	const KEY_CODES = new Map([
		[37, "left"], [38, "up"], [39, "right"], [40, "down"],
		[65, "left"], [87, "up"], [68, "right"], [83, "down"],
		[16, "slow"],
		[32, "action"], [13, "action"],
		[27, "pause"], [80, "pause"]
	]);

	const Key = {};
	exports.Key = Key;

	const handleKeyEvent = (event, isKeyDown) => {
		const code = KEY_CODES.get(event.keyCode);
		if (code) Key[code] = isKeyDown;
		if (window.STAGE === 4) return;
		event.stopPropagation();
		event.preventDefault();
	};

	window.addEventListener("keydown", event => handleKeyEvent(event, true), false);
	window.addEventListener("keyup", event => handleKeyEvent(event, false), false);

	if (isMobile) {
		const joy = new JoyStick('joyDiv', { width: 300, height: 300, autoReturnToCenter: true });
		const inactiveKeys = () => Object.keys(Key).forEach(code => Key[code] = false);

		setInterval(() => {
			if (window.STAGE === 4) return;
			const direction = joy.GetDir();
			inactiveKeys();
			(joyDirMap[direction] || []).forEach(dir => Key[dir] = true);
		}, 1000 / 60);
	}

	const joyDirMap = {
		'C': [],
		'N': ['up'],
		'E': ['right'],
		'S': ['down'],
		'W': ['left'],
		'NE': ['up', 'right'],
		'SE': ['down', 'right'],
		'SW': ['down', 'left'],
		'NW': ['up', 'left']
	};

})(window);
