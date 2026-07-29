import { Furniture, Table } from "../POO/classes/Board/Tile/Furniture";
import { Position } from "../POO/classes/Position/Position";
import { Direction } from "../POO/enums/Direction";

describe("Furniture class", () => {
  it("should occupy the correct positions", () => {
    const table = new Table(Direction.RIGHT);

    const expectedPositions = [];
    expectedPositions.push(new Position(0, 0));
    expectedPositions.push(new Position(1, 0));
    expectedPositions.push(new Position(0, 1));
    expectedPositions.push(new Position(1, 1));
    expectedPositions.push(new Position(0, 2));
    expectedPositions.push(new Position(1, 2));

    const occupiedPositions = table.getOccupiedPositions(new Position(0, 0));
    const actualPositions = occupiedPositions
      .map((position) => `${position.x},${position.y}`)
      .sort();
    const expectedPositionStrings = expectedPositions
      .map((position) => `${position.x},${position.y}`)
      .sort();

    expect(table).toBeInstanceOf(Furniture);
    expect(actualPositions).toEqual(expectedPositionStrings);
  });
});
