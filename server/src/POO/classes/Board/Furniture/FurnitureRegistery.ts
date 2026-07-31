import furnitures from "../../../../shared/game_cards/furnitures.json";
import { logger } from "../../../../utils/logger";
import { Direction } from "../../../enums/Direction";
import { FurnitureAsJson } from "../../../interfaces/ClassAsJson/Board/Furniture/FurnitureAsJson";
import { Position } from "../../Position/Position";
import { Furniture } from "./Furniture";

class FurnitureRegistry {
  private furnitureMap: Map<string, Furniture> = new Map(); //"<x>,<y>" -> Furniture
  private occupiedPositions: Set<string> = new Set(); //"<x>,<y>"

  placeFurniture(furniture: Furniture, startPosition: Position): boolean {
    const positions = furniture.getOccupiedPositions(startPosition);
    const isOccupied = positions.some((pos) => this.isPositionOccupied(pos));
    if (isOccupied) {
      logger.error(
        `Cannot place furniture ${furniture.FurnitureType} at ${startPosition.toString()}. Position is already occupied.`,
      );
      return false;
    }
    positions.forEach((pos) => {
      this.occupiedPositions.add(pos.toString());
    });
    this.furnitureMap.set(startPosition.toString(), furniture);
    return true;
  }

  removeFurniture(startPosition: Position): boolean {
    const furniture = this.furnitureMap.get(startPosition.toString());
    if (!furniture) {
      logger.error(
        `No furniture found at position ${startPosition.toString()} to remove.`,
      );
      return false;
    }
    const positions = furniture.getOccupiedPositions(startPosition);
    positions.forEach((pos) => {
      this.occupiedPositions.delete(pos.toString());
    });
    this.furnitureMap.delete(startPosition.toString());
    return true;
  }

  createFurnitureFromReference(
    furnitureReference: string,
    direction: Direction,
  ): Furniture | undefined {
    const furnitureData = furnitures.find(
      (f) => f.furnitureId === furnitureReference,
    );
    if (!furnitureData) {
      logger.error(`Furniture with reference ${furnitureReference} not found.`);
      return undefined;
    }
    return new Furniture(
      direction,
      furnitureData.length,
      furnitureData.width,
      furnitureReference,
    );
  }

  getFurnitureAtPosition(position: Position): Furniture | undefined {
    return this.furnitureMap.get(position.toString());
  }

  isPositionOccupied(position: Position): boolean {
    return this.occupiedPositions.has(position.toString());
  }

  toJson(): FurnitureAsJson[] {
    const furnitureJsonArray: FurnitureAsJson[] = [];
    this.furnitureMap.forEach((furniture, position) => {
      const [x, y] = position.split(",").map(Number);
      if (!x || !y) {
        logger.error(`Invalid position format: ${position}`);
        return;
      }
      furnitureJsonArray.push(furniture.toJson(new Position(x, y)));
    });
    return furnitureJsonArray;
  }
}

export { FurnitureRegistry };
