import { Position } from "../../POO/classes/Position/Position";

export function isInRange(
  playerPosition: Position,
  targetPosition: Position,
  range: string
): boolean {
  switch (range) {
    case "visible":
      if (!isPositionVisible(playerPosition, targetPosition)) {
        console.log("Position not visible");
        return false;
      }
      return true;
    case "any":
      return true;
    default:
      console.log("Unknown range type:", range);
      return true;
  }
}

export function isPositionVisible(
  playerPosition: Position,
  targetedPosition: Position
): boolean {
  console.log(
    "Checking visibility from",
    playerPosition,
    "to",
    targetedPosition
  );
  //   const xDifference = playerPosition.x - targetedPosition.x;
  //   const yDifference = playerPosition.y - targetedPosition.y;
  //   const distance = Math.sqrt(
  //     xDifference * xDifference + yDifference * yDifference
  //   );

  // Implement the logic to determine if the position is visible to the player -> Bresenham algorithm
  return true; // Placeholder implementation
}
