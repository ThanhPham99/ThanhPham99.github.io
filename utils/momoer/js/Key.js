(function (exports) {
	const isMobile = {
		Android: function () {
			return navigator.userAgent.match(/Android/i);
		},
		BlackBerry: function () {
			return navigator.userAgent.match(/BlackBerry/i);
		},
		iOS: function () {
			return navigator.userAgent.match(/iPhone|iPad|iPod/i);
		},
		Opera: function () {
			return navigator.userAgent.match(/Opera Mini/i);
		},
		Windows: function () {
			return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
		},
		any: function () {
			return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
		}
	};
	// Singleton
	var Key = {};
	exports.Key = Key;

	// Keycodes to words mapping
	var KEY_CODES = {
		37: "left", 38: "up", 39: "right", 40: "down",
		65: "left", 87: "up", 68: "right", 83: "down",
		16: "slow",
		32: "action", 13: "action",
		27: "pause", 80: "pause"
	};
	if (isMobile.any()) {

		var joy = new JoyStick('joyDiv');

		const inactiveKeys = () => {
			for (let k in KEY_CODES) {
				var code = KEY_CODES[k];
				Key[code] = false;
			}
		}
		setInterval(function () {
			if (window.STAGE == 4) return;
			const direction = joy.GetDir();
			console.log(direction);
			switch (direction) {
				case 'C':
					inactiveKeys()
					break;
				case 'N':
					inactiveKeys()
					Key['up'] = true;
					break;
				case 'E':
					inactiveKeys()
					Key['right'] = true;
					break;
				case 'S':
					inactiveKeys()
					Key['down'] = true;
					break;
				case 'W':
					inactiveKeys()
					Key['left'] = true;
					break;
				case 'NE':
					inactiveKeys()
					Key['up'] = true;
					Key['right'] = true;
					break;
				case 'SE':
					inactiveKeys()
					Key['down'] = true;
					Key['right'] = true;
					break;
				case 'SW':
					inactiveKeys()
					Key['down'] = true;
					Key['left'] = true;
					break;
				case 'NW':
					inactiveKeys()
					Key['up'] = true;
					Key['left'] = true;
					break;
				default:
					break;
			}
		}, 1000 / 60);
	}

	// Event Handling
	var onKeyDown = function (event) {
		var code = KEY_CODES[event.keyCode];
		Key[code] = true;
		if (window.STAGE == 4) return;
		event.stopPropagation();
		event.preventDefault();
	}
	var onKeyUp = function (event) {
		var code = KEY_CODES[event.keyCode];
		Key[code] = false;
		if (window.STAGE == 4) return;
		event.stopPropagation();
		event.preventDefault();
	}
	window.addEventListener("keydown", onKeyDown, false);
	window.addEventListener("keyup", onKeyUp, false);

})(window);