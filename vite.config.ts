import { sveltekit } from '@sveltejs/kit/vite';
import { type ViteDevServer, defineConfig } from 'vite';

import { Server } from 'socket.io';

// development websocket server
const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server : ViteDevServer ) {
		if (!server.httpServer) return

		const io = new Server(server.httpServer)

		io.on('connection', (socket) => {
			socket.emit('eventFromServer', 'Hello, World 👋')

			socket.on('joinRoom', (roomId) => {
				console.log(`${socket.id} joined room: ${roomId}`);
				socket.join(roomId);
			})

			socket.on('leaveRoom', (roomId) => {
				console.log(`${socket.id} left room: ${roomId}`);
				io.to(roomId).emit('eventFromServer', `${socket.id} left room: ${roomId}`);
				socket.leave(roomId);
			})

			socket.on('message', ({ roomId, message }) => {
				console.log(`Message from ${socket.id}: ${message}`);
				console.log(io.sockets.adapter.rooms);
				io.to(roomId).emit('eventFromServer', message);
			})

		})
	}
}

export default defineConfig({
	plugins: [sveltekit(), webSocketServer]
});
