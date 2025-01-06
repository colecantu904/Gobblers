<script lang="ts">
  import { io } from 'socket.io-client'

  const socket = io()

    let roomCode = ''
    let message = ''

  socket.on('eventFromServer', (message) => {
    console.log(message)
  })
</script>

<form on:submit|preventDefault={() => socket.emit('joinRoom', roomCode)}>
    <input type="text" placeholder="Enter your room code" bind:value={roomCode} required />
    <button type="submit">Send message to server</button>
</form>

<form on:submit|preventDefault={() => socket.emit('message', message)}>
    <input type="text" placeholder="Enter your message" bind:value={message} required />
    <button type="submit">Send message to server</button>
</form>