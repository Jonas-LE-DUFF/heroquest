import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { MonsterCategory } from "../../enums/Categories/MonsterCategory";
import { Direction } from "../../enums/Direction";
import { Position } from "../Position/Position";
import { Tile } from "../Tile";
import { Unit } from "../Units/Unit";
import { BoardInitializer } from "./BoardInitializer";
import { DoorGrid } from "./DoorGrid";
import { WallGrid } from "./WallGrid";

class Board {
    BOARD_WIDTH = 19;
    BOARD_HEIGHT = 26;

    Map: Tile[][];
    Walls: WallGrid;
    Doors: DoorGrid;

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
        return this.Map[position.y]![position.x];
    }

    getPositionOfUnit(unitId?: string): Position | null {
        if(!unitId) {
            return null;
        }
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                const tile = this.Map[y]![x];
                if (tile!.unit && tile!.unit.id === unitId) {
                    return new Position(x, y);
                }
            }
        }
        return null;
    }

    getUnitAt(
        position: Position,
    ): Unit<HeroCategory | MonsterCategory> | undefined {
        return this.getTileAtPosition(position)?.unit || undefined;
    }

    hasWallAt(position: Position, direction: Direction): boolean {
        if (
            !position.isValid(this.BOARD_WIDTH, this.BOARD_HEIGHT) ||
            !position
                .afterMove(direction)
                .isValid(this.BOARD_WIDTH, this.BOARD_HEIGHT)
        ) {
            return false;
        }
        const isCrossingHorizontal = this.isCrossingHorizontal(direction);
        if (isCrossingHorizontal) {
            return this.Walls.horizontal[position.y]![position.x]!;
        }else{
            return this.Walls.vertical[position.y]![position.x]!;
        }
    }

    hasDoorAt(position: Position, direction: Direction): boolean {
        const positionAfterMove = position.afterMove(direction);
        if (
            !position.isValid(this.BOARD_WIDTH, this.BOARD_HEIGHT) ||
            !positionAfterMove.isValid(this.BOARD_WIDTH, this.BOARD_HEIGHT)
        ) {
            return false;
        }
        const isCrossingHorizontal = this.isCrossingHorizontal(direction);
        if (isCrossingHorizontal) {
            return this.Doors.horizontal[positionAfterMove.y]![positionAfterMove.x]!;
        }else{
            return this.Doors.vertical[positionAfterMove.y]![positionAfterMove.x]!;
        }
    }

    isCrossingHorizontal(direction: Direction): boolean {
        return direction === Direction.UP || direction === Direction.DOWN;
    }

    openDoor(position: Position, direction: Direction): void {
        if (!this.hasDoorAt(position, direction)) {
            return;
        }
        const positionAfterMove = position.afterMove(direction);
        const isCrossingHorizontal = this.isCrossingHorizontal(direction);

        if (isCrossingHorizontal) {
            this.Doors.horizontal[positionAfterMove.y]![positionAfterMove.x] = false;
            this.Walls.horizontal[positionAfterMove.y]![positionAfterMove.x] = false;
        }else{
            this.Doors.vertical[positionAfterMove.y]![positionAfterMove.x] = false;
            this.Walls.vertical[positionAfterMove.y]![positionAfterMove.x] = false;
        }
    }

    removeUnitFromTile(unit: Unit<HeroCategory | MonsterCategory>): void {
        const position = this.getPositionOfUnit(unit.id);
        if (position) {
            const tile = this.getTileAtPosition(position);
            if (tile) {
                tile.unit = null;
            }
        }
    }
}

export { Board };
