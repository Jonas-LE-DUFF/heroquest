import { Board } from "../POO/classes/Board/Board";
import { Furniture } from "../POO/classes/Board/Furniture/Furniture";
import { FurnitureRegistry } from "../POO/classes/Board/Furniture/FurnitureRegistery";
import { Position } from "../POO/classes/Position/Position";
import { Direction } from "../POO/enums/Direction";

describe("Furniture class", () => {
  it("should occupy the correct positions", () => {
    const table = new Furniture(Direction.RIGHT, 3, 2, "Table");

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

describe("FurnitureRegistry class", () => {
  it("should be able to tell if a position is occupied", () => {
    const registry = new FurnitureRegistry();
    const position = new Position(0, 0);
    const furnitureReference = "table";

    const furniture = registry.createFurnitureFromReference(
      furnitureReference,
      Direction.RIGHT,
    );
    const placed = registry.placeFurniture(furniture!, position);

    expect(placed).toBe(true);
    expect(registry.isPositionOccupied(position)).toBe(true);
    expect(registry.isPositionOccupied(new Position(1, 2))).toBe(true);
  });

  it("should allow removing furniture and free up positions", () => {
    const registry = new FurnitureRegistry();
    const position = new Position(0, 0);
    const furnitureReference = "table";

    const furniture = registry.createFurnitureFromReference(
      furnitureReference,
      Direction.RIGHT,
    );
    registry.placeFurniture(furniture!, position);
    const removed = registry.removeFurniture(position);

    expect(removed).toBe(true);
    expect(registry.isPositionOccupied(position)).toBe(false);
    expect(registry.isPositionOccupied(new Position(1, 2))).toBe(false);
  });

  it("should not allow placing furniture on occupied positions", () => {
    const registry = new FurnitureRegistry();
    const position1 = new Position(0, 0);
    const position2 = new Position(0, 1);
    const furnitureReference = "table";

    const furniture = registry.createFurnitureFromReference(
      furnitureReference,
      Direction.RIGHT,
    );
    registry.placeFurniture(furniture!, position1);

    const placed = registry.placeFurniture(furniture!, position2);

    expect(placed).toBe(false);
    expect(registry.isPositionOccupied(position2)).toBe(true);
    expect(registry.isPositionOccupied(new Position(1, 3))).toBe(false);
  });
});

describe("Board class", () => {
  it("should place furniture correctly", () => {
    const board = new Board();
    const position = new Position(0, 0);
    const furnitureReference = "table";
    const placed = board.placeFurniture(
      furnitureReference,
      position,
      Direction.RIGHT,
    );

    expect(placed).toBe(true);
  });
});
