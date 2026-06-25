import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { MonsterCategory } from "../../enums/Categories/MonsterCategory";
import { Direction } from "../../enums/Direction";
import { TileType } from "../../enums/Board/TileType";
import { BoardAsJson } from "../../interfaces/ClassAsJson/Board/BoardAsJson";
import { Position } from "../Position/Position";
import { Tile } from "./Tile/Tile";
import { Unit } from "../Units/Unit";
import { BoardInitializer } from "./BoardInitializer";
import { DoorGrid } from "./DoorGrid";
import { WallGrid } from "./WallGrid";
import { TrapType } from "../../enums/Board/TrapType";

class Board {
  BOARD_WIDTH = 19;
  BOARD_HEIGHT = 26;

  private Map: Tile[][];
  private Walls: WallGrid;
  private Doors: DoorGrid;

  constructor() {
    this.Map = BoardInitializer.initializeBoard();
    this.Walls = BoardInitializer.initializeWalls();
    this.Doors = BoardInitializer.initializeDoors();
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
    const positionAfterMove = position.doorPosition(direction);
    const isCrossingHorizontal = this.isCrossingHorizontal(direction);
    if (isCrossingHorizontal) {
      return this.Walls.horizontal[positionAfterMove.x]![positionAfterMove.y]!;
    } else {
      return this.Walls.vertical[positionAfterMove.x]![positionAfterMove.y]!;
    }
  }

  hasDoorAt(position: Position, direction: Direction): boolean {
    const positionAfterMove = position.doorPosition(direction);
    const isCrossingHorizontal = this.isCrossingHorizontal(direction);
    if (isCrossingHorizontal) {
      return this.Doors.horizontal[positionAfterMove.x]![positionAfterMove.y]!;
    } else {
      return this.Doors.vertical[positionAfterMove.x]![positionAfterMove.y]!;
    }
  }

  isCrossingHorizontal(direction: Direction): boolean {
    return direction === Direction.UP || direction === Direction.DOWN;
  }

  private setDoorStateAt(
    position: Position,
    direction: Direction,
    isClosed: boolean,
  ): {
    success: boolean;
    error?: string;
    doorPlace?: {
      position: Position;
      verticalOrHorizontal: "vertical" | "horizontal";
    };
  } {
    const doorPosition = position.doorPosition(direction);
    if (
      !position.isValid(this.BOARD_WIDTH, this.BOARD_HEIGHT) ||
      !doorPosition.isValid(this.BOARD_WIDTH, this.BOARD_HEIGHT)
    ) {
      return { success: false, error: "Invalid door position" };
    }
    const isCrossingHorizontal = this.isCrossingHorizontal(direction);

    if (isCrossingHorizontal) {
      this.Doors.horizontal[doorPosition.x]![doorPosition.y] = isClosed;
      this.Walls.horizontal[doorPosition.x]![doorPosition.y] = isClosed;
      return {
        success: true,
        doorPlace: {
          position: doorPosition,
          verticalOrHorizontal: "horizontal",
        },
      };
    } else {
      this.Doors.vertical[doorPosition.x]![doorPosition.y] = isClosed;
      this.Walls.vertical[doorPosition.x]![doorPosition.y] = isClosed;
      return {
        success: true,
        doorPlace: {
          position: doorPosition,
          verticalOrHorizontal: "vertical",
        },
      };
    }
  }

  openDoor(position: Position, direction: Direction): void {
    this.setDoorStateAt(position, direction, false);
  }

  placeDoor(
    position: Position,
    direction: Direction,
  ): {
    success: boolean;
    doorPlace?: {
      position: Position;
      verticalOrHorizontal: "vertical" | "horizontal";
    };
    error?: string;
  } {
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
      console.error("Unit not found on board:", unit.id);
      return null;
    }
    const tile = this.getTileAtPosition(position);
    if (!tile) {
      console.error("Tile not found at position:", position);
      return null;
    }
    return tile.removeDesignatedUnit(unit.id);
  }

  clearTileAtPosition(position: Position): string | null {
    const tile = this.getTileAtPosition(position);
    if (tile) {
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
    const isCrossingHorizontal = this.isCrossingHorizontal(direction);
    if (isCrossingHorizontal) {
      this.Walls.horizontal[positionAfterMove.x]![positionAfterMove.y] = true;
    } else {
      this.Walls.vertical[positionAfterMove.x]![positionAfterMove.y] = true;
    }
  }

  toJson(gameMaster: boolean): BoardAsJson {
    return {
      width: this.BOARD_WIDTH,
      height: this.BOARD_HEIGHT,
      tiles: this.Map.map((row) => row.map((tile) => tile.toJson(gameMaster))),
      doors: {
        horizontalDoors: this.Doors.horizontal,
        verticalDoors: this.Doors.vertical,
      },
      walls: {
        horizontalWalls: this.Walls.horizontal,
        verticalWalls: this.Walls.vertical,
      },
    };
  }
}
export { Board };
