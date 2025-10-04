import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { handler } from "../build/handler.js";

// gotta fix this import for typescript
// where does it put the functions on build?
// import { isValidMove, getWinner } from "../src/lib/gameLogic.js";

const port = process.env.PORT || 3000;
const app = express();
const server = createServer(app);

const io = new Server(server);

const rooms = {};

// for now just copy the functions here
// later can try to fix the import
export function possibleMoves(gameState) {
  let moves = [];

  let turn = getTurn(gameState);

  let pieces = getPossiblePieces(gameState);

  for (let i = 0; i < gameState.length; i++) {
    for (let j = 0; j < gameState[i].length; j++) {
      for (let color = 0; color < pieces.length; color++) {
        if (turn === color) {
          for (let k = 0; k < pieces[color].length; k++) {
            if (pieces[color][k] > 0) {
              // might need to add if turn is color here, so that the empty spaces dont default
              if (gameState[i][j].length > 0) {
                if (gameState[i][j][0][1] < k) {
                  moves.push({
                    color: `${color}`,
                    size: `${k}`,
                    row: `${i}`,
                    col: `${j}`,
                  });
                }
              } else {
                moves.push({
                  color: `${color}`,
                  size: `${k}`,
                  row: `${i}`,
                  col: `${j}`,
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
        pieces[gameState[i][j][k][0]][gameState[i][j][k][1]] -= 1;
      }
    }
  }

  return pieces;
}

// checks if the move is in the possible moves
export function isValidMove(gameState, move) {
  let moves = possibleMoves(gameState);

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
      gameState[i][0][0][0] == gameState[i][1][0][0] &&
      gameState[i][1][0][0] == gameState[i][2][0][0]
    ) {
      return gameState[i][0][0][0];
    }
  }

  // columns
  for (let i = 0; i < 2; i++) {
    if (
      gameState[0][i].length > 0 &&
      gameState[1][i].length > 0 &&
      gameState[2][i].length > 0 &&
      gameState[0][i][0][0] == gameState[1][i][0][0] &&
      gameState[1][i][0][0] == gameState[2][i][0][0]
    ) {
      return gameState[0][i][0][0];
    }
  }

  // write the diagonals
  if (
    gameState[0][0].length > 0 &&
    gameState[1][1].length > 0 &&
    gameState[2][2].length > 0 &&
    gameState[0][0][0][0] == gameState[1][1][0][0] &&
    gameState[1][1][0][0] == gameState[2][2][0][0]
  ) {
    return gameState[0][0][0][0];
  }

  if (
    gameState[2][0].length > 0 &&
    gameState[1][1].length > 0 &&
    gameState[0][2].length > 0 &&
    gameState[2][0][0][0] == gameState[1][1][0][0] &&
    gameState[1][1][0][0] == gameState[0][2][0][0]
  ) {
    return gameState[2][0][0][0];
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
        if (cell[0] == 1) {
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
  socket.emit("eventFromServer", "Hello, World 👋");
  console.log("player connected:", socket.id);

  socket.on("joinRoom", ({ roomId, gameState }) => {
    console.log(`${socket.id} joined room: ${roomId}`);
    console.log("currentGameState:", gameState);

    let playerColor;

    // better handling for joining rooms multiple times
    // checking if socket id is already in players for that room
    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: {},
        gameState: gameState,
      };

      rooms[roomId].players[socket.id] = { score: 0, color: 0 };
      playerColor = 0;
    } else {
      rooms[roomId].players[socket.id] = { score: 0, color: 1 };
      playerColor = 1;
    }
    // update gamestate for newly connected players

    // send game state to client
    io.to(roomId).emit("gameState", rooms[roomId].gameState);
    io.to(roomId).emit(
      "eventFromServer",
      `${socket.id} joined room: ${roomId}`
    );

    // Send the player's color to the specific socket that joined
    socket.emit("joinedRoom", playerColor);

    socket.join(roomId);
  });

  socket.on("leaveRoom", (roomId) => {
    console.log(`${socket.id} left room: ${roomId}`);
    io.to(roomId).emit("eventFromServer", `${socket.id} left room: ${roomId}`);
    socket.leave(roomId);

    // remove the player from the rooms
    delete rooms[roomId].players[socket.id];

    // check the length of players to see if all players have left
    if (Object.keys(rooms[roomId].players).length == 0) {
      // remove the room from rooms
      delete rooms[roomId];
    }
    console.log(rooms);
  });

  // need to write restart socket call, in order to reset the board

  socket.on("makeMove", ({ roomId, currentMove }) => {
    console.log(`${socket.id} made move: ${currentMove["color"]}`);
    // check game logic for move, update game state, send new game state to all clients
    console.log(rooms[roomId].players[socket.id].color, currentMove["color"]);
    if (rooms[roomId].players[socket.id].color == currentMove["color"]) {
      if (isValidMove(rooms[roomId].gameState, currentMove)) {
        // fix for js
        rooms[roomId].gameState[currentMove["row"]][currentMove["col"]].unshift(
          [currentMove["color"], currentMove["size"]]
        );
        console.log("game state:", rooms[roomId].gameState);
        io.to(roomId).emit("gameState", rooms[roomId].gameState);
        io.to(roomId).emit("eventFromServer", currentMove);
      }
    }
    // if it is not a valid move, then emit a invalid message to the chat

    // needs to work for ties
    let over = getWinner(rooms[roomId].gameState);
    if (over) {
      console.log("game over");
      io.to(roomId).emit("eventFromServer", `game over, winner is: ${over}`);
    }
  });
});

// SvelteKit should handle everything else using Express middleware
// https://github.com/sveltejs/kit/tree/master/packages/adapter-node#custom-server
app.use(handler);

server.listen(port);
