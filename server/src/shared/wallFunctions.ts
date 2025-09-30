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
      return walls.horizontal[x]?.[y] ?? true; // Mur en haut

    case Direction.DOWN:
      return walls.horizontal[x + 1]?.[y] ?? true; // Mur en bas

    case Direction.LEFT:
      return walls.vertical[x]?.[y] ?? true; // Mur à gauche

    case Direction.RIGHT:
      return walls.vertical[x]?.[y + 1] ?? true; // Mur à droite

    default:
      return true;
  }
};

export const canMove = (
  gameState: GameState,
  from: Position,
  direction: Direction
): boolean => {
  // Vérifier les murs
  if (hasWall(gameState.walls, from, direction)) {
    return false;
  }

  // Vérifier la position de destination
  const to = getPositionAfterMove(from, direction);
  if (gameState.board[to.x]?.[to.y]?.type !== tileType.empty) {
    console.error("occupied spot");

    return false;
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
