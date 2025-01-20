import { sveltekit } from '@sveltejs/kit/vite';
import { type ViteDevServer, defineConfig } from 'vite';

import { Server } from 'socket.io';

import { isValidMove, getWinner, isGameOver } from './src/lib/gameLogic.js';

// basically works
type roomsType = {
	[key: string]: {
		players: Record<string, Record<string, string | number>>;
		gameState: Array<Array<Array<[string, number]>>>;
	};
  };

const rooms: roomsType = {};

// development websocket server
const webSocketServer = {
	name: 'webSocketServer',
	configureServer( server : ViteDevServer ) {
		if (!server.httpServer) return

		const io = new Server(server.httpServer)

		io.on('connection', (socket) => {
			socket.emit('eventFromServer', 'Hello, World 👋')
			console.log('player connected:', socket.id);

			socket.on('joinRoom', ( { roomId, gameState } ) => {
				console.log(`${socket.id} joined room: ${roomId}`);
				console.log('currentGameState:', gameState);
				if (!rooms[roomId]) {
					rooms[roomId] = {
						players: {},
						gameState: gameState
					};
				} else {
					rooms[roomId].players[socket.id] = { score : 0, color: 'red' };
				}
				
				rooms[roomId].players[socket.id] = { score : 0, color: 'blue' };

				// send game state to client
				io.to(roomId).emit('gameState', rooms[roomId].gameState);
				io.to(roomId).emit('eventFromServer', `${socket.id} joined room: ${roomId}`);
				
				socket.join(roomId);
			})

			socket.on('leaveRoom', (roomId) => {
				console.log(`${socket.id} left room: ${roomId}`);
				io.to(roomId).emit('eventFromServer', `${socket.id} left room: ${roomId}`);
				socket.leave(roomId);
			})

			socket.on('makeMove', ({ roomId, currentMove }) => {
				console.log(`${socket.id} made move: ${currentMove['color']}`);
				// check game logic for move, update game state, send new game state to all clients
				if (isValidMove(rooms[roomId].gameState, currentMove)) { 
					// fix for js
					rooms[roomId].gameState[currentMove['row']][currentMove['col']].unshift([currentMove['color'], currentMove['size']])
					console.log('game state:', rooms[roomId].gameState);
					io.to(roomId).emit('gameState', rooms[roomId].gameState);
					io.to(roomId).emit('eventFromServer', currentMove);
				}
				// needs to work for ties
				let over : string | null = getWinner(rooms[roomId].gameState);
				if (over) {
					console.log('game over');
					io.to(roomId).emit('eventFromServer', `game over, winner is: ${over}`);
				}
			})

		})
	}
}

export default defineConfig({
	plugins: [sveltekit(), webSocketServer]
});
