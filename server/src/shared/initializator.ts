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
  // The original generation logic produced arrays in a transposed orientation.
  // To preserve the original wall pattern while returning walls in the
  // conventional shapes expected by the client, we first build the original
  // arrays (oldHorizontal: 27x19 and oldVertical: 26x20) using the same
  // conditions, then remap/transpose them into
  // horizontal: (rows+1) x cols  -> 20 x 26
  // vertical: rows x (cols+1)    -> 19 x 27

  // build old arrays exactly as before
  const oldHorizontal: boolean[][] = [];
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
        (j < 6 || j > 12) // horizontal corridors
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
    oldHorizontal.push(row);
  }

  const oldVertical: boolean[][] = [];
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
    oldVertical.push(row);
  }

  // now remap into the conventional shapes
  const walls: WallGrid = { horizontal: [], vertical: [] };

  // horizontal: (rows+1) x cols  => indices r:0..rows, c:0..cols-1
  for (let r = 0; r < rows + 1; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < cols; c++) {
      // map from oldVertical (26 x 20): oldVertical[c][r]
      // oldVertical shape: i 0..25, j 0..19
      row.push(!!oldVertical[c]?.[r]);
    }
    walls.horizontal.push(row);
  }

  // vertical: rows x (cols+1) => indices r:0..rows-1, c:0..cols
  for (let r = 0; r < rows; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < cols + 1; c++) {
      // map from oldHorizontal (27 x 19): oldHorizontal[c][r]
      // oldHorizontal shape: i 0..26, j 0..18
      row.push(!!oldHorizontal[c]?.[r]);
    }
    walls.vertical.push(row);
  }

  return walls;
}

export { initializeBoard, initializeWalls };
