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

    getTileAtPosition(position: Position): Tile | undefined{
        if (position.x < 0 || position.x >= this.BOARD_WIDTH || position.y < 0 || position.y >= this.BOARD_HEIGHT) {
            return undefined;
        }
        return this.Map[position.y]![position.x];
    }

    getPositionOfUnit(unitId: string): Position | null {
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

    getUnitAt(position: Position): Unit<HeroCategory | MonsterCategory> | undefined {
        return this.getTileAtPosition(position)?.unit || undefined;
    }

    hasWallAt(position: Position, direction: Direction): boolean {
        if (!position.isValid(this.BOARD_WIDTH, this.BOARD_HEIGHT)) {
            return false;
        }
        switch (direction) {
            case Direction.UP:
                if (position.y === 0) {
                    return false;
                }
                return this.Walls.horizontal[position.y - 1]![position.x]!;
            case Direction.DOWN:
                if (position.y === this.BOARD_HEIGHT - 1) {
                    return false;
                }
                return this.Walls.horizontal[position.y]![position.x]!;
            case Direction.LEFT:
                if (position.x === 0) {
                    return false;
                }
                return this.Walls.vertical[position.y]![position.x - 1]!;
            case Direction.RIGHT:
                if (position.x === this.BOARD_WIDTH - 1) {
                    return false;
                }
                return this.Walls.vertical[position.y]![position.x]!;
        }
    }

    hasDoorAt(position: Position, direction: Direction): boolean {
        if (!position.isValid(this.BOARD_WIDTH, this.BOARD_HEIGHT)) {
            return false;
        }
        switch (direction) {
            case Direction.UP:
                if (position.y === 0) {
                    return false;
                }
                return this.Doors.horizontal[position.y - 1]![position.x]!;
            case Direction.DOWN:
                if (position.y === this.BOARD_HEIGHT - 1) {
                    return false;
                }
                return this.Doors.horizontal[position.y]![position.x]!;
            case Direction.LEFT:
                if (position.x === 0) {
                    return false;
                }
                return this.Doors.vertical[position.y]![position.x - 1]!;
            case Direction.RIGHT:
                if (position.x === this.BOARD_WIDTH - 1) {
                    return false;
                }
                return this.Doors.vertical[position.y]![position.x]!;
        }
    }
}

export { Board };
