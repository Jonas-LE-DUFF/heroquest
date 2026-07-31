import { Direction } from "../../../enums/Direction";
import { FurnitureAsJson } from "../../../interfaces/ClassAsJson/Board/Furniture/FurnitureAsJson";
import { Position } from "../../Position/Position";

class Furniture {
  private direction: Direction;
  private length: number; // length in the direction given by the direction property
  private width: number; // width perpendicular to the direction property (clockwise)
  public readonly FurnitureType: string;

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

  toJson(pos: Position): FurnitureAsJson {
    let width = this.width;
    let length = this.length;
    if (this.direction === Direction.UP || this.direction === Direction.DOWN) {
      // Swap width and length for horizontal furniture
      [width, length] = [length, width];
    }
    return {
      direction: this.direction,
      length: this.length,
      width: this.width,
      furnitureType: this.FurnitureType,
      position: { x: pos.x, y: pos.y },
    };
  }
}

export { Furniture };
