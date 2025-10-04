import { sveltekit } from "@sveltejs/kit/vite";
import { type ViteDevServer, defineConfig } from "vite";

import { Server } from "socket.io";

import { isValidMove, getWinner, isGameOver } from "./src/lib/gameLogic";

import type { state } from "./src/lib/gameLogic.js";

// basically works
type roomsType = {
  [key: string]: {
    players: Record<string, Record<string, string | number>>;
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

        socket.emit("joinedRoom", playerColor);

        socket.join(roomId);
      });

      socket.on("leaveRoom", (roomId) => {
        console.log(`${socket.id} left room: ${roomId}`);
        io.to(roomId).emit(
          "eventFromServer",
          `${socket.id} left room: ${roomId}`
        );
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
        console.log(
          rooms[roomId].players[socket.id].color,
          currentMove["color"]
        );
        if (rooms[roomId].players[socket.id].color == currentMove["color"]) {
          if (isValidMove(rooms[roomId].gameState, currentMove)) {
            // fix for js
            rooms[roomId].gameState[currentMove["row"]][
              currentMove["col"]
            ].unshift([currentMove["color"], currentMove["size"]]);
            console.log("game state:", rooms[roomId].gameState);
            io.to(roomId).emit("gameState", rooms[roomId].gameState);
            io.to(roomId).emit("eventFromServer", currentMove);
          }
        }
        // if it is not a valid move, then emit a invalid message to the chat

        // needs to work for ties
        let over: number | null = getWinner(rooms[roomId].gameState);
        if (over) {
          console.log("game over");
          io.to(roomId).emit(
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
