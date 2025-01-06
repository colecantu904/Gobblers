import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

import { handler } from '../build/handler.js'

const port = 3000
const app = express()
const server = createServer(app)

const io = new Server(server)

io.on('connection', (socket) => {
  socket.emit('eventFromServer', 'Hello, World 👋')

  socket.on('joinRoom', (roomId) => {
    console.log(`${socket.id} joined room: ${roomId}`);
    socket.join(roomId);
})

    socket.on('leaveRoom', (roomId) => {
        console.log(`${socket.id} left room: ${roomId}`);
        socket.leave(roomId);

        io.to(roomId).emit('eventFromServer', `${socket.id} left room: ${roomId}`);
    })

    socket.on('message', ({ message, roomId }) => {
        console.log(`Message from ${socket.id}: ${message}`);
        io.to(roomId).emit('eventFromServer', message);
    })

})

// SvelteKit should handle everything else using Express middleware
// https://github.com/sveltejs/kit/tree/master/packages/adapter-node#custom-server
app.use(handler)

server.listen(port)