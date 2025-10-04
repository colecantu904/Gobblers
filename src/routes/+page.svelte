<script lang="ts">
  // Maybe try a differnt gameState, we are going to use a 2d array
  // nulled pieces for unoccupied spaces
  // this would lead to safer logic, but it would have to be re written in certain spots
  // [
  //   [[("b", "l"), ("r", "s"), (-1, -1)], [(-1, -1), (-1,-1)], [(-1, -1), (-1,-1), (-1,-1)]],
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

  // Configure Socket.IO client for HTTPS/WSS when behind Caddy proxy
  const socket = io({
    // For local testing with Caddy on port 8443, connect directly to the proxy
    // In production, this will automatically use WSS when served over HTTPS
    transports: ["websocket", "polling"],
    upgrade: true,
    rememberUpgrade: true,
  });

  // they are strings right now because ts is retarded
  const sizes = ["40px", "70px", "100px"];

  let currentPiece: { color: number; size: number } | null = null;

  let roomId = "";

  let playerColor = -1;

  let currentPieces = [];
  $: currentPieces = getPossiblePieces(gameState);

  let chats: string[] = ["Welcome to gobblers!"];

  let currentMove: Record<string, number> = {
    color: -1,
    size: -1,
    row: -1,
    col: -1,
  };

  // Define the type for a piece
  type Piece = { color: number; size: number };

  // Define the type for the game state
  let gameState: Piece[][][] = [
    [[], [], []],
    [[], [], []],
    [[], [], []],
  ];

  $: gameState = gameState;

  socket.on("eventFromServer", (message) => {
    chats = [...chats, message];
    console.log(chats);
  });

  socket.on("gameState", (newGameState) => {
    console.log(newGameState);
    gameState = [...newGameState];
  });

  socket.on("joinedRoom", (newRoomCode, color) => {
    console.log("joined room", newRoomCode, color);
    if (!newRoomCode) {
      console.error("No room code received from server");
      return;
    }

    roomCode = newRoomCode;

    playerColor = color;
    console.log(color);

    console.log(`You are player ${playerColor}`);
  });

  socket.on("leftRoom", () => {
    roomCode = generateRoomCode(5);
    socket.emit("joinRoom", { roomCode, roomId: roomCode });
  });

  function generateRoomCode(length: number) {
    let result = "";
    let characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }

  // generate a room code
  let roomCode = generateRoomCode(5);
  // join the room
  socket.emit("joinRoom", { roomCode, roomId: roomCode });
</script>

<div id="main-container">
  <!-- lets just stick wiht making a working room joining system and stuff -->

  <!-- Room join system -->
  <h2 style="padding: 1rem;">{roomCode}</h2>
  <form
    on:submit|preventDefault={() =>
      socket.emit("joinRoom", { roomId, roomCode })}
  >
    <input
      type="text"
      placeholder="Enter your room code"
      bind:value={roomId}
      required
    />
    <button type="submit">Join room</button>
    <button type="button" on:click={() => socket.emit("leaveRoom", roomCode)}
      >Leave room</button
    >
    <button type="button" on:click={() => socket.emit("resetGame", roomCode)}
      >Reset Game</button
    >
  </form>

  <!-- Game board -->
  <div id="board-container">
    <div class="board">
      {#each gameState as row, rowIndex}
        {#each row as cell, cellIndex}
          <button
            type="button"
            class="cell"
            aria-label="Cell {rowIndex}, {cellIndex}"
            on:click={() => {
              if (currentPiece && roomCode) {
                currentMove = {
                  color: currentPiece.color,
                  size: currentPiece.size,
                  row: rowIndex,
                  col: cellIndex,
                };
                socket.emit("makeMove", { roomCode, currentMove });
                console.log(currentMove);
                currentPiece = null;
              }
            }}
            on:keydown={(e) => {
              if (
                (e.key === "Enter" || e.key === " ") &&
                currentPiece &&
                roomCode
              ) {
                currentMove = {
                  color: currentPiece.color,
                  size: currentPiece.size,
                  row: rowIndex,
                  col: cellIndex,
                };
                socket.emit("makeMove", { roomCode, currentMove });
                currentPiece = null;
              }
            }}
          >
            {#if cell.length > 0}
              {console.log(cell[0].size, sizes[cell[0].size])}
              {#if cell[0].color == 0}
                <div
                  class="piece"
                  style="background-color: blue; height: {sizes[
                    cell[0].size
                  ]}; width: {sizes[cell[0].size]};"
                ></div>
              {:else}
                <div
                  class="piece"
                  style="background-color: red; height: {sizes[
                    cell[0].size
                  ]}; width: {sizes[cell[0].size]};"
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
        {#if piece > 0}
          <button
            type="button"
            class="piece-selector"
            aria-label="Select piece"
            on:click={() => {
              currentPiece = { color: playerColor, size: index };
              console.log(currentPiece);
            }}
          >
            <div
              class="piece"
              style="background-color: {playerColor == 0
                ? 'blue'
                : 'red'}; height: {index == 2
                ? '120px'
                : index == 1
                  ? '80px'
                  : '50px'}; width: {index == 2
                ? '120px'
                : index == 1
                  ? '80px'
                  : '50px'};"
            ></div>
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

  #board-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
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
    grid-template-rows: repeat(3, 150px);
    grid-template-columns: repeat(3, 150px);
    gap: 5px;
    background-color: #2c2a33;
  }

  .cell {
    width: 150px;
    height: 150px;
    border: 2px solid black;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background-color: #f8f8f8;
  }

  @media (max-width: 500px) {
    .board {
      grid-template-rows: repeat(3, 100px);
      grid-template-columns: repeat(3, 100px);
    }

    .cell {
      width: 100px;
      height: 100px;
    }
  }

  .piece {
    line-height: 50px;
    font-weight: bold;
    border-radius: 50%;
    cursor: grab;
  }
</style>
