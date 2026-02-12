import { Direction } from "../../enums/Direction";

class Position {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  isValid(BoardWidth: number, BoardHeight: number): boolean {
    return (
      this.x >= 0 && this.x < BoardWidth && this.y >= 0 && this.y < BoardHeight
    );
  }

  afterMove(direction: Direction): Position {
    switch (direction) {
      case Direction.UP:
        return new Position(this.x - 1, this.y);
      case Direction.DOWN:
        return new Position(this.x + 1, this.y);
      case Direction.LEFT:
        return new Position(this.x, this.y - 1);
      case Direction.RIGHT:
        return new Position(this.x, this.y + 1);
    }
  }

  doorPosition(direction: Direction): Position {
    switch (direction) {
      case Direction.UP:
        return new Position(this.x, this.y);
      case Direction.DOWN:
        return new Position(this.x + 1, this.y);
      case Direction.LEFT:
        return new Position(this.x, this.y);
      case Direction.RIGHT:
        return new Position(this.x, this.y + 1);
    }
  }
}

export { Position };
