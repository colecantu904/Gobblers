<script lang="ts">
  // the games state will the a 2d array of tuples
  // [
  //   [[("b", "l"), ("r", "s")], [], []],
  //   [[], [], [("b", "l"), ("r", "s")]],
  //   [[], [("b", "l"), ("r", "s")], []]
  // ]
  // moves to update the gamestate will be sent to the server in the format:
  // (row, col, color, size)
  // (0, 0, "b", "l")
  //
  // all rendereing will be done based on the game state
  // create piece svelete component, that can handle drag and drop
  // create board that can display and piece holders that render current gamestate

  import { io } from 'socket.io-client'

  const socket = io()

  let roomId = ''
  let message = ''

  let gameState = [
    [[], [], []],
    [[], [], []],
    [[], [], []]
  ]

  socket.on('eventFromServer', ( message ) => {
    console.log(message)
  })

  socket.on('gameState', (newGameState) => {
    console.log(newGameState)
    gameState = newGameState
  })

</script>

<!-- Simple messaging system -->
<form on:submit|preventDefault={() => socket.emit('joinRoom', roomId)}>
  <input type="text" placeholder="Enter your room code" bind:value={roomId} required />
  <button type="submit">Join room</button>
  <button type="button" on:click={() => socket.emit('leaveRoom', roomId )}>Leave room</button>
</form>

<form on:submit|preventDefault={() => socket.emit('message', { roomId, message })}>
  <input type="text" placeholder="Enter your message" bind:value={message} required />
  <button type="submit">Send message to server</button>
</form>

