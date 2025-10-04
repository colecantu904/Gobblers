import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { handler } from "../build/handler.js";

// gotta fix this import for typescript
// where does it put the functions on build?
// import { isValidMove, getWinner } from "../src/lib/gameLogic.js";

const port = process.env.PORT || 3000;
const app = express();

// Configure Express to trust proxy (required when behind Caddy)
app.set("trust proxy", true);

const server = createServer(app);

// Configure Socket.IO with CORS and proxy settings
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://yourdomain.com"] // Replace with your actual domain
        : ["http://localhost:5173", "https://localhost:8443"], // SvelteKit dev server and local Caddy
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Allow both WebSocket and polling transports
  transports: ["websocket", "polling"],
  // Configure for reverse proxy
  allowEIO3: true,
});

const rooms = {};

// for now just copy the functions here
// later can try to fix the import
export function possibleMoves(gameState) {
  let moves = [];

  let turn = getTurn(gameState);
  console.log("turn:", turn);

  let pieces = getPossiblePieces(gameState);

  for (let i = 0; i < gameState.length; i++) {
    for (let j = 0; j < gameState[i].length; j++) {
      for (let color = 0; color < pieces.length; color++) {
        if (turn === color) {
          for (let k = 0; k < pieces[color].length; k++) {
            if (pieces[color][k] > 0) {
              // might need to add if turn is color here, so that the empty spaces dont default
              if (gameState[i][j].length > 0) {
                if (gameState[i][j][0].size < k) {
                  moves.push({
                    color: color,
                    size: k,
                    row: i,
                    col: j,
                  });
                }
              } else {
                moves.push({
                  color: color,
                  size: k,
                  row: i,
                  col: j,
                });
              }
              // it might have to be the strings?
            }
          }
        }
      }
    }
  }
  return moves;
}

export function getPossiblePieces(gameState) {
  let pieces = [
    [2, 2, 2],
    [2, 2, 2],
  ];

  for (let i = 0; i < gameState.length; i++) {
    for (let j = 0; j < gameState[i].length; j++) {
      for (let k = 0; k < gameState[i][j].length; k++) {
        pieces[gameState[i][j][k].color][gameState[i][j][k].size] -= 1;
      }
    }
  }

  return pieces;
}

// checks if the move is in the possible moves
export function isValidMove(gameState, move) {
  let moves = possibleMoves(gameState);

  console.log("possible moves:", moves);
  console.log("current move:", move);

  for (const thing of moves) {
    if (
      thing.color === move.color &&
      thing.size === move.size &&
      thing.row === move.row &&
      thing.col === move.col
    ) {
      return true;
    }
  }

  return false;
}

// checks if the board is in a terminal state, and returns the winner or tie (no possible moves), or null for not
export function isGameOver(gameState) {
  console.log("isGameOver");
  return null;
}

// this is definitley one way to do it
export function getWinner(gameState) {
  // row
  for (let i = 0; i < 2; i++) {
    if (
      gameState[i][0].length > 0 &&
      gameState[i][1].length > 0 &&
      gameState[i][2].length > 0 &&
      gameState[i][0][0].color == gameState[i][1][0].color &&
      gameState[i][1][0].color == gameState[i][2][0].color
    ) {
      return gameState[i][0][0].color;
    }
  }

  // columns
  for (let i = 0; i < 2; i++) {
    if (
      gameState[0][i].length > 0 &&
      gameState[1][i].length > 0 &&
      gameState[2][i].length > 0 &&
      gameState[0][i][0].color == gameState[1][i][0].color &&
      gameState[1][i][0].color == gameState[2][i][0].color
    ) {
      return gameState[0][i][0].color;
    }
  }

  // write the diagonals
  if (
    gameState[0][0].length > 0 &&
    gameState[1][1].length > 0 &&
    gameState[2][2].length > 0 &&
    gameState[0][0][0].color == gameState[1][1][0].color &&
    gameState[1][1][0].color == gameState[2][2][0].color
  ) {
    return gameState[0][0][0].color;
  }

  if (
    gameState[2][0].length > 0 &&
    gameState[1][1].length > 0 &&
    gameState[0][2].length > 0 &&
    gameState[2][0][0].color == gameState[1][1][0].color &&
    gameState[1][1][0].color == gameState[0][2][0].color
  ) {
    return gameState[2][0][0].color;
  }

  if (!possibleMoves(gameState)) {
    return -1; // tie
  } else {
    return null;
  }
}

// blue is always first
function getTurn(gameState) {
  let red = 0;
  let blue = 0;
  for (const col of gameState) {
    for (const row of col) {
      for (const cell of row) {
        if (cell.color == 1) {
          red += 1;
        } else {
          blue += 1;
        }
      }
    }
  }
  // if blue has more pieces on the board, then its red's turn
  if (blue > red) {
    return 1;
  } else {
    return 0;
  }
}

io.on("connection", (socket) => {
  // log connection
  socket.emit("eventFromServer", "Hello, World 👋");
  console.log("player connected:", socket.id);

  socket.on("joinRoom", ({ roomId, currentRoom }) => {
    let playerColor;

    // better handling for joining rooms multiple times
    // checking if socket id is already in players for that room

    // Get the number of players in the room using Object.keys
    const numPlayers = rooms[roomId]
      ? Object.keys(rooms[roomId].players).length
      : 0;

    if (rooms[roomId] && numPlayers < 2 && currentRoom != roomId) {
      // leave current Room
      socket.leave(currentRoom);

      // join the room
      socket.join(roomId);

      // assign player color
      rooms[roomId].players[socket.id] = { color: 1, score: 0 };

      socket.emit("gameState", rooms[roomId].gameState);

      console.log(roomId);

      socket.emit("joinedRoom", roomId, 1);
    } else if (!rooms[roomId]) {
      // create the room
      socket.join(roomId);

      rooms[roomId] = {
        players: { [socket.id]: { color: 0, score: 0 } },
        gameState: [
          [[], [], []],
          [[], [], []],
          [[], [], []],
        ],
      };

      socket.emit("gameState", rooms[roomId].gameState);

      socket.emit("joinedRoom", roomId, 0);
    }
  });

  // need to consider: how should I store players? should I use records for quick refernce
  // in make move and other possible event listeners? Or should I use a list for easy lenght
  // reference for room size logic in room joining? probably the former...

  socket.on("leaveRoom", (roomCode) => {
    const numPlayers = rooms[roomCode]
      ? Object.keys(rooms[roomCode].players).length
      : 0;

    // if last person delete the room

    // remove the player from room
    socket.leave(roomCode);

    // remove player from rooms
    delete rooms[roomCode].players[socket.id];

    if (rooms[roomCode] && numPlayers < 2) {
      // send event to player to generate new room code
      delete rooms[roomCode];
    }

    socket.emit("leftRoom");
  });

  socket.on("resetGame", (roomCode) => {
    if (rooms[roomCode]) {
      rooms[roomCode].gameState = [
        [[], [], []],
        [[], [], []],
        [[], [], []],
      ];
    }

    io.to(roomCode).emit("gameState", rooms[roomCode].gameState);
  });

  // need to write restart socket call, in order to reset the board

  socket.on("makeMove", ({ roomCode, currentMove }) => {
    console.log(
      `${socket.id} made move: ${currentMove.color} ${currentMove.size}`
    );

    console.log(roomCode);
    console.log(rooms[roomCode].gameState);

    // check game logic for move, update game state, send new game state to all clients

    if (
      rooms[roomCode].players[socket.id].color == currentMove.color &&
      getWinner(rooms[roomCode].gameState) === null
    ) {
      if (isValidMove(rooms[roomCode].gameState, currentMove)) {
        // fix for js

        rooms[roomCode].gameState[currentMove.row][currentMove.col].unshift({
          color: currentMove.color,
          size: currentMove.size,
        });

        // log the new game state
        console.log("game state:", rooms[roomCode].gameState);

        // emit new gameState to all clients in the room
        io.to(roomCode).emit("gameState", rooms[roomCode].gameState);
        io.to(roomCode).emit("eventFromServer", currentMove);
      }
    }
    // if it is not a valid move, then emit a invalid message to the chat

    // needs to work for ties
    let over = getWinner(rooms[roomCode].gameState);

    if (over !== null) {
      console.log("game over");
      io.to(roomCode).emit("eventFromServer", `game over, winner is: ${over}`);
    }
  });
});
// SvelteKit should handle everything else using Express middleware
// https://github.com/sveltejs/kit/tree/master/packages/adapter-node#custom-server
app.use(handler);

server.listen(port);
