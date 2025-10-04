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

  // TODO
  // room id not emmitting properly, moves made after game over, string indexed sizes, piece containers, room id standard, room size limits
  // make sure you are good to push to prod!

  import { io } from "socket.io-client";
  import { get, writable } from "svelte/store";
  import { getPossiblePieces } from "$lib/gameLogic";

  const socket = io();

  // they are strings right now because ts is retarded
  const sizes = {
    "2": "20px",
    "1": "7.5px",
    "0": "6px",
  };

  let currentPieces = [];

  let currentPiece: { color: string; size: string } | null = null;

  let roomId = "";

  let playerColor = "";

  $: currentPieces = getPossiblePieces(gameState);

  let chats: string[] = ["Welcome to gobblers!"];

  let currentMove: any = {
    color: "",
    size: "",
    row: "",
    col: "",
  };

  let gameState = [
    [[], [], []],
    [[], [], []],
    [[], [], []],
  ];

  socket.on("eventFromServer", (message) => {
    chats = [...chats, message];
    console.log(chats);
  });

  socket.on("gameState", (newGameState) => {
    console.log(newGameState);
    gameState = [...newGameState];
  });

  socket.on("joinedRoom", (color, newGameState) => {
    playerColor = color;
    console.log(`You are player ${playerColor}`);
  })

</script>



<div id="main-container">
<!-- lets just stick wiht making a working room joining system and stuff -->

<!-- Room join system -->
<form
  on:submit|preventDefault={() => 
  socket.emit("joinRoom", { roomId, gameState })
  }
>
  <input
    type="text"
    placeholder="Enter your room code"
    bind:value={roomId}
    required
  />
  <button type="submit">Join room</button>
  <button type="button" on:click={() => socket.emit("leaveRoom", roomId)}
    >Leave room</button
  >
</form>

<!-- Game board / move maker -->
<!--right now the sizes are sent as strings to the websocket, need to change that -->
<form
  on:submit|preventDefault={() =>
    socket.emit("makeMove", { roomId, currentMove })}
>
  <input
    type="text"
    placeholder="Enter your piece color"
    bind:value={currentMove["color"]}
    required
  />
  <!-- Size will now be a value between 0-2 -->
  <input
    type="text"
    placeholder="Enter your size 0-2"
    bind:value={currentMove["size"]}
    required
  />
  <input
    type="text"
    placeholder="Enter your piece row"
    bind:value={currentMove["row"]}
    required
  />
  <input
    type="text"
    placeholder="Enter your piece col"
    bind:value={currentMove["col"]}
    required
  />
  <button type="submit">Submit move</button>
</form>

<!-- Game board underdevelopment -->
<!-- not going to make it drag and drop, but rather click on the piece you want, then click on the space to put it -->
<!-- The atcual board will just alawys reflect the game state, all logic is handled server side -->
<!--even the piece containers will be rendered off of the board -->

<!-- opponents pieces on the left of the board and players on the right -->


<div id="board-container">
<div class="board">
  {#each gameState as row, rowIndex}
    {#each row as cell, cellIndex}
      <button
        type="button"
        class="cell"
        aria-label="Cell {rowIndex}, {cellIndex}"
        on:click={() => {
          if (currentPiece && roomId) {
            currentMove = {
              color: `${currentPiece.color}`,
              size: currentPiece.size,
              row: `${rowIndex}`,
              col: `${cellIndex}`
            };
            socket.emit("makeMove", { roomId, currentMove });
            console.log(currentMove);
            currentPiece = null;
          }
        }}
        on:keydown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && currentPiece && roomId) {
            currentMove = {
              color: currentPiece.color,
              size: currentPiece.size,
              row: rowIndex,
              col: cellIndex
            };
            socket.emit("makeMove", { roomId, currentMove });
            currentPiece = null;
          }
        }}
      >
        {#if cell.length > 0}
          {console.log(cell[0][0], sizes[cell[0][1]])}
          {#if cell[0][0] == 0}
            <div
              class="piece"
              style="background-color: blue; height: {sizes[
                cell[0][1]
              ]}; width: {sizes[cell[0][1]]};"
            ></div>
          {:else}
            <div
              class="piece"
              style="background-color: red; height: {sizes[
                cell[0][1]
              ]}; width: {sizes[cell[0][1]]};"
            ></div>
          {/if}
        {/if}
      </button>
    {/each}
  {/each}
</div>

<!-- players pieces on the right of the board -->
 <div class="pieces-container"> 
    <h3>Your pieces</h3>
    {#each currentPieces[Number(playerColor)] as piece, index}
      {#if piece > 0 }
      <button
        type="button"
        class="piece-selector"
        aria-label="Select piece"
        on:click={() => {
          currentPiece = { color: playerColor, size: `${index}` };
          console.log(currentPiece);
        }}
      >
        <div class="piece" style="background-color: {playerColor == '0' ? 'blue' : 'red'}; height: {index == 2 ? '10vw' : index == 1 ? '7.5vw' : '6vw'}; width: {index == 2 ? '10vw' : index == 1 ? '7.5vw' : '6vw'};"></div>
      </button>
      {/if}
    {/each}
 </div>

</div>

<!-- Chat -->
<h3>Chat</h3>
{#each chats as message}
  <p>{message}</p>
{/each}

</div>

<style>
  #main-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #3a3740;
    color: white;
    font-family: Arial, sans-serif;
    gap: 20px;
  }

  @media (min-width: 500px) {
    #board-container {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
    }
  }

  @media (max-width: 500px) {
    #board-container {
      flex-direction: column;
    }
  }
  

  .pieces-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-left: 20px;
  }

  .piece-selector {
    padding: 5px;
    cursor: pointer;
    background-color: transparent;
    border-radius: 5px;
  }

  .piece-selector:focus {
    background-color: rgba(130, 129, 129, 0.637);
  }

  .board {
    display: grid;
    grid-template-rows: repeat(3, 100px);
    grid-template-columns: repeat(3, 100px);
    gap: 5px;
    background-color: #2c2a33;
  }

  .cell {
    width: 100px;
    height: 100px;
    border: 2px solid black;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2em;
    cursor: pointer;
    background-color: #f8f8f8;
  }

  .piece {
    background: lightblue;
    text-align: center;
    line-height: 50px;
    font-weight: bold;
    border-radius: 50%;
    cursor: grab;
  }
</style>
