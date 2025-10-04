// need to write:
// possible moves given a gameState
// check if move is valid
// check if game is over
// maybe: check if game is a draw

// bunch of icky code fr

// maybe fix the types later

import { get } from "svelte/store";

// we are going to change the move so that it makes sense
// { color: "0", size: "1", row: "0", col: "2" } for example

export type state = Array<Array<Array<Record<string, number>>>>;

// checks getTurn, and produces all possible moves for the board
export function possibleMoves(gameState: state): Array<Record<string, number>> {
  let moves: Array<Record<string, number>> = [];

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

export function getPossiblePieces(gameState: state): Array<Array<number>> {
  let pieces: Array<Array<number>> = [
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
export function isValidMove(
  gameState: state,
  move: Record<string, number>
): boolean {
  let moves: Array<Record<string, number>> = possibleMoves(gameState);

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
export function isGameOver(gameState: state): any {
  console.log("isGameOver");
  return null;
}

// this is definitley one way to do it
export function getWinner(gameState: state): number | null {
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
function getTurn(gameState: state): any {
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
