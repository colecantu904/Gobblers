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

  let chats : string[] = [ "Welcome to gobblers!" ];

  let currentMove : any = {
    color : '',
    size : '',
    row : '',
    col : ''
  }

  let gameState = [
    [[], [], []],
    [[], [], []],
    [[], [], []]
  ]

  socket.on('eventFromServer', ( message ) => {
    chats = [...chats, message]
    console.log(chats)
  })

  socket.on('gameState', (newGameState) => {
    console.log(newGameState)
    gameState = newGameState
  })

</script>

<!-- Room join system -->
<form on:submit|preventDefault={() => socket.emit('joinRoom', { roomId, gameState })}>
  <input type="text" placeholder="Enter your room code" bind:value={roomId} required />
  <button type="submit">Join room</button>
  <button type="button" on:click={() => socket.emit('leaveRoom', roomId )}>Leave room</button>
</form>

<!-- Game board / move maker -->
<form on:submit|preventDefault={() => socket.emit('makeMove', { roomId, currentMove })}>
  <input type="text" placeholder="Enter your piece color" bind:value={currentMove['color']} required />
  <!-- Size will now be a value between 0-2 -->
  <input type="text" placeholder="Enter your size 0-2" bind:value={currentMove['size']} required />
  <input type="text" placeholder="Enter your piece row" bind:value={currentMove['row']} required />
  <input type="text" placeholder="Enter your piece col" bind:value={currentMove['col']} required />
  <button type="submit">Submit move</button>
</form>

<!-- Game board underdevelopment -->


<!-- Chat -->
<h3>Chat</h3>
{#each chats as message}
  <p>{message}</p>
{/each}
