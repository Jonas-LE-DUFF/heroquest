import { Direction } from "../../../enums/Direction";
import { Position } from "../../Position/Position";

abstract class Furniture {
  private direction: Direction;
  private length: number; // length in the direction given by the direction property
  private width: number; // width perpendicular to the direction property (clockwise)
  private FurnitureType: string;

  constructor(
    direction: Direction,
    length: number,
    width: number,
    furnitureType: string,
  ) {
    this.direction = direction;
    this.length = length;
    this.width = width;
    this.FurnitureType = furnitureType;
  }

  getOccupiedPositions(startPosition: Position): Position[] {
    const positions: Position[] = [];
    const widthDirection = Position.getPerpendicularDirection(this.direction);
    // Implementation for getting occupied positions based on furniture dimensions and direction
    for (let l = 0; l < this.length; l++) {
      for (let w = 0; w < this.width; w++) {
        let pos = startPosition
          .afterMove(this.direction, l)
          .afterMove(widthDirection, w);
        positions.push(pos);
      }
    }

    return positions;
  }
}

class Table extends Furniture {
  constructor(direction: Direction) {
    super(direction, 3, 2, "Table"); // Table occupies 3 tiles in length and 2 tiles in width
  }
}

export { Furniture, Table };
