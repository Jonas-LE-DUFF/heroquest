import { Tile, tileType, WallGrid } from "./type";

const rows = 19;
const cols = 26;

function initializeBoard(): Tile[][] {
  const board: Tile[][] = [];

  for (let i = 0; i < rows; i++) {
    const row: Tile[] = [];
    for (let j = 0; j < cols; j++) {
      row.push({
        type: tileType.empty,
        revealed: false,
      });
    }
    board.push(row);
  }
  return board;
}

function initializeWalls(): WallGrid {
  // build old arrays exactly as before
  const horizontal: boolean[][] = [];
  for (let i = 0; i < 20; i++) {
    const row: boolean[] = [];
    for (let j = 0; j < 26; j++) {
      if (i === 0 || i === 19) {
        row.push(true);
      } else if ([1, 18].includes(i) && ![0, 12, 13, 25].includes(j)) {
        // 0, 12, 13, 25 are the horizontal corridors
        row.push(true);
      } else if (i === 6 && j >= 9 && j <= 16 && j !== 12 && j !== 13) {
        row.push(true);
      } else if (i === 13 && j >= 5 && j <= 17 && j !== 12 && j !== 13) {
        row.push(true);
      } else if (
        [9, 10].includes(i) &&
        (j <= 8 || j >= 17) &&
        j !== 0 &&
        j !== 25
      ) {
        row.push(true);
      } else if ((i === 7 || i === 12) && j >= 10 && j <= 15) {
        row.push(true);
      } else if (i === 4 && j !== 0 && j <= 8) {
        row.push(true);
      } else if (i === 5 && j >= 17 && j !== 25) {
        row.push(true);
      } else if (i === 14 && ((j >= 1 && j <= 4) || (j >= 18 && j <= 25))) {
        row.push(true);
      } else {
        row.push(false);
      }
    }
    horizontal.push(row);
  }

  const vertical: boolean[][] = [];
  for (let i = 0; i < 19; i++) {
    const row: boolean[] = [];
    for (let j = 0; j < 27; j++) {
      if (j === 0 || j === 26) {
        row.push(true);
      } else if ([1, 5, 9, 21, 25].includes(j) && ![0, 9, 18].includes(i)) {
        // 0, 9 and 18 are the vertical corridors
        row.push(true);
      } else if (
        [12, 14].includes(j) &&
        ![0, 18].includes(i) &&
        (i < 6 || i > 12) // vertical corridors
      ) {
        row.push(true);
      } else if (j === 18 && i >= 13 && ![0, 9, 18].includes(i)) {
        /* the next part is a bit weird but the board is made this way... */
        row.push(true);
      } else if (j === 17 && i <= 12 && ![0, 9, 18].includes(i)) {
        row.push(true);
      } else if ([10, 16].includes(j) && i >= 7 && i <= 11) {
        row.push(true);
      } else if (j === 7 && i >= 10 && i <= 12) {
        row.push(true);
      } else {
        row.push(false);
      }
    }
    vertical.push(row);
  }

  // now remap into the conventional shapes
  const walls: WallGrid = { horizontal: horizontal, vertical: vertical };

  return walls;
}

export { initializeBoard, initializeWalls };
