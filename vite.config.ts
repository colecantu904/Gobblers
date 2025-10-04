import { sveltekit } from "@sveltejs/kit/vite";
import { type ViteDevServer, defineConfig } from "vite";

import { Server } from "socket.io";

import { isValidMove, getWinner, isGameOver } from "./src/lib/gameLogic";

import type { state } from "./src/lib/gameLogic.js";
import { get } from "svelte/store";

// basically works
type roomsType = {
  [key: string]: {
    players: Record<string, Record<string, number | string>>;
    gameState: state;
  };
};

const rooms: roomsType = {};

// development websocket server
const webSocketServer = {
  name: "webSocketServer",
  configureServer(server: ViteDevServer) {
    if (!server.httpServer) return;

    const io = new Server(server.httpServer);

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

            rooms[roomCode].gameState[currentMove.row][currentMove.col].unshift(
              {
                color: currentMove.color,
                size: currentMove.size,
              }
            );

            // log the new game state
            console.log("game state:", rooms[roomCode].gameState);

            // emit new gameState to all clients in the room
            io.to(roomCode).emit("gameState", rooms[roomCode].gameState);
            io.to(roomCode).emit("eventFromServer", currentMove);
          }
        }
        // if it is not a valid move, then emit a invalid message to the chat

        // needs to work for ties
        let over: number | null = getWinner(rooms[roomCode].gameState);

        if (over !== null) {
          console.log("game over");
          io.to(roomCode).emit(
            "eventFromServer",
            `game over, winner is: ${over}`
          );
        }
      });
    });
  },
};

export default defineConfig({
  plugins: [sveltekit(), webSocketServer],
});
