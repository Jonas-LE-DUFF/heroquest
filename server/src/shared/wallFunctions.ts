import { Position, WallGrid, Direction, GameState, tileType } from "./type";

// shared/wallLogic.ts
export const hasWall = (
  walls: WallGrid,
  from: Position,
  direction: Direction
): boolean => {
  const { x, y } = from;

  switch (direction) {
    case Direction.UP:
      return walls.horizontal[x]?.[y] ?? false; // Top Wall

    case Direction.DOWN:
      return walls.horizontal[x + 1]?.[y] ?? false; // Bottom Wall

    case Direction.LEFT:
      return walls.vertical[x]?.[y] ?? false; // Left Wall

    case Direction.RIGHT:
      return walls.vertical[x]?.[y + 1] ?? false; // Right Wall

    default:
      return false;
  }
};

export const hasDoor = (
  doors: { horizontal: boolean[][]; vertical: boolean[][] },
  from: Position,
  direction: Direction
): boolean => {
  return hasWall(doors, from, direction); // Same logic as walls
};

export const openDoor = (
  doors: { horizontal: boolean[][]; vertical: boolean[][] },
  walls: WallGrid,
  from: Position,
  direction: Direction
): void => {
  console.log("openning door");

  const { x, y } = from;
  switch (direction) {
    case Direction.UP:
      if (walls.horizontal[x]?.[y]) {
        walls.horizontal[x][y] = false;
      }
      if (doors.horizontal[x]) {
        doors.horizontal[x][y] = false;
      }
      break;
    case Direction.DOWN: {
      const wallRow = walls.horizontal[x + 1];
      if (wallRow && y >= 0 && y < wallRow.length) {
        wallRow[y] = false;
      }
      const row = doors.horizontal[x + 1];
      if (row && y >= 0 && y < row.length) {
        row[y] = false;
      }
      break;
    }
    case Direction.LEFT:
      if (walls.vertical[x]?.[y]) {
        walls.vertical[x][y] = false;
      }
      if (doors.vertical[x]?.[y]) {
        doors.vertical[x][y] = false;
      }
      break;
    case Direction.RIGHT:
      if (walls.vertical[x]?.[y + 1]) {
        walls.vertical[x][y + 1] = false;
      }
      if (doors.vertical[x]?.[y + 1]) {
        doors.vertical[x][y + 1] = false;
      }
      break;
  }
};

export const canMove = (
  gameState: GameState,
  from: Position,
  direction: Direction
): boolean => {
  if (
    hasWall(gameState.walls, from, direction) &&
    !hasDoor(gameState.doors, from, direction)
  ) {
    console.error("wall in the way");
    return false;
  }

  const to = getPositionAfterMove(from, direction);
  if (gameState.board[to.x]?.[to.y]?.type !== tileType.empty) {
    console.error("tile is occupied");
    return false;
  }

  if (hasDoor(gameState.doors, from, direction)) {
    openDoor(gameState.doors, gameState.walls, from, direction);
  }

  return true;
};

export const getPositionAfterMove = (
  from: Position,
  direction: Direction
): Position => {
  switch (direction) {
    case Direction.UP:
      return { x: from.x - 1, y: from.y };
    case Direction.DOWN:
      return { x: from.x + 1, y: from.y };
    case Direction.LEFT:
      return { x: from.x, y: from.y - 1 };
    case Direction.RIGHT:
      return { x: from.x, y: from.y + 1 };
    default:
      return from;
  }
};
