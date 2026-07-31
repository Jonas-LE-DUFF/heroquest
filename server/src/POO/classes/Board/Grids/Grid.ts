import { Direction } from "../../../enums/Direction";
import { Position } from "../../Position/Position";

export class Grid {
  private horizontal: boolean[][]; // walls between the tiles horizontally
  private vertical: boolean[][]; // walls between the tiles vertically
  constructor(horizontal: boolean[][], vertical: boolean[][]) {
    this.horizontal = horizontal;
    this.vertical = vertical;
  }

  isCrossingHorizontal(direction: Direction): boolean {
    return direction === Direction.UP || direction === Direction.DOWN;
  }

  hasElemAt(position: Position, direction: Direction): boolean {
    const positionAfterMove = position.doorPosition(direction);
    const isCrossingHorizontal = this.isCrossingHorizontal(direction);
    if (isCrossingHorizontal) {
      return this.horizontal[positionAfterMove.x]![positionAfterMove.y]!;
    } else {
      return this.vertical[positionAfterMove.x]![positionAfterMove.y]!;
    }
  }

  placeStateAt(
    doorPosition: Position,
    direction: Direction,
    isClosed: boolean,
  ): void {
    const isCrossingHorizontal = this.isCrossingHorizontal(direction);

    if (isCrossingHorizontal) {
      this.horizontal[doorPosition.x]![doorPosition.y] = isClosed;
    } else {
      this.vertical[doorPosition.x]![doorPosition.y] = isClosed;
    }
  }

  toJson(): { horizontal: boolean[][]; vertical: boolean[][] } {
    return {
      horizontal: this.horizontal,
      vertical: this.vertical,
    };
  }
}
