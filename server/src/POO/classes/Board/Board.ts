import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { MonsterCategory } from "../../enums/Categories/MonsterCategory";
import { Direction } from "../../enums/Direction";
import { TileType } from "../../enums/Board/TileType";
import { BoardAsJson } from "../../interfaces/ClassAsJson/Board/BoardAsJson";
import { Position } from "../Position/Position";
import { Tile } from "./Tile/Tile";
import { Unit } from "../Units/Unit";
import { BoardInitializer } from "./Grids/BoardInitializer";
import { TrapType } from "../../enums/Board/TrapType";
import { logger } from "../../../utils/logger";
import { FurnitureRegistry } from "./Furniture/FurnitureRegistery";
import { Grid } from "./Grids/Grid";

class Board {
  BOARD_WIDTH = 19;
  BOARD_HEIGHT = 26;

  private Map: Tile[][];
  private Walls: Grid;
  private Doors: Grid;
  private Furnitures: FurnitureRegistry;

  constructor() {
    this.Map = BoardInitializer.initializeBoard();
    this.Walls = BoardInitializer.initializeWalls();
    this.Doors = BoardInitializer.initializeDoors();
    this.Furnitures = new FurnitureRegistry();
  }

  placeFurniture(
    furniture: string,
    startPosition: Position,
    direction: Direction,
  ): boolean {
    const newFurniture = this.Furnitures.createFurnitureFromReference(
      furniture,
      direction,
    );
    if (!newFurniture) {
      return false;
    }
    const positions = newFurniture.getOccupiedPositions(startPosition);
    const canPlace = positions.every(
      (pos) =>
        pos.isValid(this.BOARD_WIDTH, this.BOARD_HEIGHT) &&
        !this.Furnitures.isPositionOccupied(pos),
    );

    if (canPlace) {
      return this.Furnitures.placeFurniture(newFurniture, startPosition);
    }
    return false;
  }

  getTileAtPosition(position: Position): Tile | undefined {
    if (
      position.x < 0 ||
      position.x >= this.BOARD_WIDTH ||
      position.y < 0 ||
      position.y >= this.BOARD_HEIGHT
    ) {
      return undefined;
    }
    return this.Map[position.x]![position.y];
  }

  getPositionOfUnit(unitId: string): Position | null {
    for (let x = 0; x < this.BOARD_WIDTH; x++) {
      for (let y = 0; y < this.BOARD_HEIGHT; y++) {
        const tile = this.Map[x]![y];
        if (tile!.unitId === unitId || tile!.transientUnitId === unitId) {
          return new Position(x, y);
        }
      }
    }
    return null;
  }

  getUnitAt(position: Position): string | undefined {
    const tile = this.getTileAtPosition(position);
    return tile?.unitId || tile?.transientUnitId || undefined;
  }

  placeUnitAt(
    unit: Unit<HeroCategory | MonsterCategory>,
    position: Position,
  ): void {
    const tile = this.getTileAtPosition(position);
    if (tile) {
      tile.placeUnit(unit.id);
    }
  }

  hasWallAt(position: Position, direction: Direction): boolean {
    return this.Walls.hasElemAt(position, direction);
  }

  hasDoorAt(position: Position, direction: Direction): boolean {
    return this.Doors.hasElemAt(position, direction);
  }

  private setDoorStateAt(
    position: Position,
    direction: Direction,
    isClosed: boolean,
  ): boolean {
    const doorPosition = position.doorPosition(direction);
    if (
      !position.isValid(this.BOARD_WIDTH, this.BOARD_HEIGHT) ||
      !doorPosition.isValid(this.BOARD_WIDTH, this.BOARD_HEIGHT)
    ) {
      return false;
    }
    this.Doors.placeStateAt(doorPosition, direction, isClosed);
    this.Walls.placeStateAt(doorPosition, direction, isClosed);
    return true;
  }

  openDoor(position: Position, direction: Direction): void {
    this.setDoorStateAt(position, direction, false);
  }

  placeDoor(position: Position, direction: Direction): boolean {
    return this.setDoorStateAt(position, direction, true);
  }

  placeTrap(gameId: string, position: Position, trapType: TrapType): void {
    const tile = this.getTileAtPosition(position);
    if (tile) {
      tile.placeTrap(gameId, trapType);
    }
  }

  removeUnitFromTile(
    unit: Unit<HeroCategory | MonsterCategory>,
  ): string | null {
    const position = this.getPositionOfUnit(unit.id);
    if (!position) {
      logger.warn("Unit not found on board:", unit.id);
      return null;
    }
    const tile = this.getTileAtPosition(position);
    if (!tile) {
      logger.error("Tile not found at position:", position);
      return null;
    }
    return tile.removeDesignatedUnit(unit.id);
  }

  clearTileAtPosition(position: Position): string | null {
    const tile = this.getTileAtPosition(position);
    if (tile) {
      this.Furnitures.removeFurniture(position);
      return tile.eraseTile();
    }
    return null;
  }

  getSpawnPointPosition(): Position | null {
    for (let x = 0; x < this.BOARD_WIDTH; x++) {
      for (let y = 0; y < this.BOARD_HEIGHT; y++) {
        const tile = this.Map[x]![y];
        if (tile!.type === TileType.SPAWN_POINT) {
          return new Position(x, y);
        }
      }
    }
    return null;
  }

  placeThinWall(position: Position, direction: Direction) {
    const positionAfterMove = position.doorPosition(direction);
    this.Walls.placeStateAt(positionAfterMove, direction, true);
  }

  isPositionOccupied(position: Position): boolean {
    const tile = this.getTileAtPosition(position);
    if (!tile) {
      logger.error("Tile not found at position:", position);
      return true;
    }
    return tile?.isOccupied();
  }

  isImpassable(position: Position): boolean {
    return this.Furnitures.isPositionOccupied(position);
  }

  toJson(gameMaster: boolean): BoardAsJson {
    return {
      width: this.BOARD_WIDTH,
      height: this.BOARD_HEIGHT,
      tiles: this.Map.map((row) => row.map((tile) => tile.toJson(gameMaster))),
      doors: this.Doors.toJson(),
      walls: this.Walls.toJson(),
      furnitures: this.Furnitures.toJson(),
    };
  }
}
export { Board };
