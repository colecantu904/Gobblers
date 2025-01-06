import { sveltekit } from '@sveltejs/kit/vite';
import { type ViteDevServer, defineConfig } from 'vite';

import { Server } from 'socket.io';

const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server : ViteDevServer ) {
		if (!server.httpServer) return

		const io = new Server(server.httpServer)

		io.on('connection', (socket) => {
			socket.emit('eventFromServer', 'Hello, World 👋')

			socket.on('joinRoom', (room) => {
				console.log(`${socket.id} joined room: ${room}`);
				socket.join(room);
			})

			socket.on('leaveRoom', (room) => {
				console.log(`${socket.id} left room: ${room}`);
				socket.leave(room);

				io.to(room).emit('eventFromServer', `${socket.id} left room: ${room}`);
			})

			socket.on('message', (message) => {
				console.log(`Message from ${socket.id}: ${message}`);
				io.emit('eventFromServer', message);
			})

		})
	}
}

export default defineConfig({
	plugins: [sveltekit(), webSocketServer]
});
