import { env } from './env';

let socket;
let listeners = {};

export const RealBlueiotClient = {
	connect: () => {
		socket = new WebSocket(env.blueiotHost);
		console.log('🔌 Connessione a BlueIOT WebSocket...');

		socket.onopen = () => {
			console.log('✅ WebSocket BlueIOT connesso');
			// Qui puoi inviare login se necessario (es. SetAccount)
		};

		socket.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.type === 'onRecvTagPos' && listeners['tagPosition']) {
				data.payload.forEach((tag) => listeners['tagPosition'](tag));
			}
			// Aggiungere altre condizioni per power, alarm e così via
		};

		socket.onclose = () => console.log('❌ WebSocket BlueIOT disconnesso');
		socket.onerror = (e) => console.error('WebSocket error:', e);
	},

	on: (event, callback) => {
		listeners[event] = callback;
	},

	disconnect: () => {
		if (socket) socket.close();
		listeners = {};
	},
};
