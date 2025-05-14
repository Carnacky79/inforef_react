let listeners = {};

export const MockBlueiotClient = {
	connect: () => {
		console.log('🔌 Connessione simulata a BlueIOT avviata');
		setInterval(() => {
			const simulatedTags = [
				{ id: 'TAG001', x: Math.random() * 100, y: Math.random() * 80 },
				{ id: 'TAG002', x: Math.random() * 100, y: Math.random() * 80 },
			];
			if (listeners['tagPosition']) {
				simulatedTags.forEach((tag) => listeners['tagPosition'](tag));
			}
		}, 3000);
	},
	on: (event, callback) => {
		listeners[event] = callback;
	},
	disconnect: () => {
		console.log('🔌 Disconnessione simulata da BlueIOT');
		listeners = {};
	},
};
