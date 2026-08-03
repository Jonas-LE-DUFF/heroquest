import { BoardAsJson } from "../POO/interfaces/ClassAsJson/Board/BoardAsJson";
import { PositionAsJson } from "../POO/interfaces/ClassAsJson/PositionAsJson";

function setDoorAtPosition(
  position: PositionAsJson,
  verticalOrHorizontal: "vertical" | "horizontal",
  board: BoardAsJson,
): BoardAsJson {
  const { x, y } = position;

  if (verticalOrHorizontal === "horizontal") {
    const row = board.doors.horizontal[x] ?? [];
    row[y] = true;
    board.doors.horizontal[x] = row;
    return board;
  } else if (verticalOrHorizontal === "vertical") {
    const row = board.doors.vertical[x] ?? [];
    row[y] = true;
    board.doors.vertical[x] = row;
    return board;
  }
  throw new Error("Invalid door orientation");
}

export { setDoorAtPosition };
