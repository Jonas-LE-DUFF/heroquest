import { Board } from "../POO/classes/Board/Board";
import { Position } from "../POO/classes/Position/Position";
import { Unit } from "../POO/classes/Units/Unit";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { MonsterCategory } from "../POO/enums/Categories/MonsterCategory";
import { Direction } from "../POO/enums/Direction";

export const canMove = (
    board: Board,
    from: Position,
    direction: Direction,
    unitMoved: Unit<HeroCategory | MonsterCategory>,
): boolean => {
    const isPlayer =
        unitMoved instanceof Unit && unitMoved.getCategory() === "Hero";
    const canPhaseThroughWalls = unitMoved.canPhaseThroughWalls();
    const canPhaseThroughMonsters = unitMoved.canPhaseThroughMonsters();
    const to = getPositionAfterMove(from, direction);

    if (!to.isValid(board.BOARD_WIDTH, board.BOARD_HEIGHT)) {
        console.error("move out of bounds");
        return false;
    }

    if (
        board.hasWallAt(from, direction) &&
        (!board.hasDoorAt(from, direction) || !isPlayer) &&
        !canPhaseThroughWalls // A monster can't open doors
    ) {
        console.error("wall in the way");
        return false;
    }

    const unit = board.getUnitAt(to);

    if (unit && !canPhaseThroughMonsters) {
        console.error("tile is occupied");
        return false;
    }
    return true;
};

export const getPositionAfterMove = (
    from: Position,
    direction: Direction,
): Position => {
    switch (direction) {
        case Direction.UP:
            return new Position(from.x, from.y - 1);
        case Direction.DOWN:
            return new Position(from.x, from.y + 1);
        case Direction.LEFT:
            return new Position(from.x - 1, from.y);
        case Direction.RIGHT:
            return new Position(from.x + 1, from.y);
        default:
            return from;
    }
};
