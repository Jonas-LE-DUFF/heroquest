import { Position, Direction, GameState, tileType, monsterClass } from "./type";

function placeDoor(
  position: Position,
  selectedType: tileType | Direction | monsterClass,
  gameState: GameState,
) {
  let positionSent = position;
  let verticalOrHorizontal: "vertical" | "horizontal" = "horizontal";
  if (selectedType === Direction.UP) {
    positionSent = position;
    verticalOrHorizontal = "horizontal";
  }

  if (selectedType === Direction.DOWN) {
    positionSent = { x: position.x + 1, y: position.y };
    verticalOrHorizontal = "horizontal";
  }

  if (selectedType === Direction.LEFT) {
    positionSent = { x: position.x, y: position.y };
    verticalOrHorizontal = "vertical";
  }
  if (selectedType === Direction.RIGHT) {
    positionSent = { x: position.x, y: position.y + 1 };
    verticalOrHorizontal = "vertical";
  }
  if (verticalOrHorizontal === "horizontal") {
    const row = gameState.doors.horizontal[positionSent.x] ?? [];
    row[positionSent.y] = true;
    gameState.doors.horizontal[positionSent.x] = row;
  } else if (verticalOrHorizontal === "vertical") {
    const row = gameState.doors.vertical[positionSent.x] ?? [];
    row[positionSent.y] = true;
    gameState.doors.vertical[positionSent.x] = row;
  }

  return {
    position: positionSent,
    verticalOrHorizontal: verticalOrHorizontal,
  };
}

export { placeDoor };
