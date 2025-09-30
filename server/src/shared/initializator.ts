import { Tile, tileType, WallGrid } from "./type";

function initializeBoard(): Tile[][] {
  const board: Tile[][] = [];
  const rows = 26;
  const cols = 19;

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
  const walls: WallGrid = {
    horizontal: [],
    vertical: [],
  };
  for (let i = 0; i < 27; i++) {
    const row: boolean[] = [];
    for (let j = 0; j < 19; j++) {
      if (i === 0 || i === 26) {
        row.push(true);
      } else if ([1, 5, 9, 21, 25].includes(i) && ![0, 9, 18].includes(j)) {
        // 0, 9 and 18 are the vertical corridors
        row.push(true);
      } else if (
        [12, 14].includes(i) &&
        ![0, 18].includes(j) &&
        (j < 6 || j > 12) // horizontal corriors
      ) {
        row.push(true);
      } else if (i === 17 && j >= 6 && ![0, 9, 18].includes(j)) {
        /* the next part is a bit weird but the board is made this way... */
        row.push(true);
      } else if (i === 18 && j < 6 && ![0, 9, 18].includes(j)) {
        row.push(true);
      } else if ([10, 16].includes(i) && j >= 7 && j <= 11) {
        row.push(true);
      } else if (i === 7 && j >= 6 && j <= 8) {
        row.push(true);
      } else {
        row.push(false);
      }
    }
    walls.horizontal.push(row);
  }

  for (let i = 0; i < 26; i++) {
    const row: boolean[] = [];
    for (let j = 0; j < 20; j++) {
      if (j === 0 || j === 19) {
        // left and right wall
        row.push(true);
      } else if ([1, 18].includes(j) && ![0, 12, 13, 25].includes(i)) {
        row.push(true);
      } else if (
        [9, 10].includes(j) &&
        ![0, 25].includes(i) &&
        (i < 9 || i > 16)
      ) {
        row.push(true);
      } else if (j === 5 && ((i >= 1 && i <= 4) || (i >= 18 && i <= 24))) {
        row.push(true);
      } else if (j === 6 && ((i >= 5 && i <= 11) || (i >= 14 && i <= 17))) {
        row.push(true);
      } else if (j === 13 && ((i >= 9 && i <= 11) || (i >= 14 && i <= 16))) {
        row.push(true);
      } else if (j === 14 && i >= 17 && i <= 24) {
        row.push(true);
      } else if (j === 15 && i >= 1 && i <= 8) {
        row.push(true);
      } else if ([7, 12].includes(j) && i >= 10 && i <= 15) {
        row.push(true);
      } else {
        row.push(false);
      }
    }
    walls.vertical.push(row);
  }

  return walls;
}

export { initializeBoard, initializeWalls };
