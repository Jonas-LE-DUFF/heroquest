import { TileType } from "../POO/enums/TileType";
import { BoardAsJson } from "../POO/interfaces/ClassAsJson/Board/BoardAsJson";
import { TileAsJson } from "../POO/interfaces/ClassAsJson/Board/TileAsJson";
import { PositionAsJson } from "../POO/interfaces/ClassAsJson/PositionAsJson";

function getTileByPosition(
    position: PositionAsJson,
    board: BoardAsJson,
): TileAsJson | null {
    const { x, y } = position;
    if (
        x < 0 ||
        y < 0 ||
        y >= board.tiles.length ||
        x >= board.tiles[y].length
    ) {
        return null;
    }
    return board.tiles[y][x];
}

function getTileByUnitId(
    unitId: string,
    board: BoardAsJson,
): TileAsJson | null {
    for (let row of board.tiles) {
        for (let tile of row) {
            if (tile.unit?.id === unitId) {
                return tile;
            }
        }
    }
    return null;
}

function getPositionByUnitId(
    unitId: string,
    board: BoardAsJson,
): PositionAsJson | null {
    for (let y = 0; y < board.tiles.length; y++) {
        for (let x = 0; x < board.tiles[y].length; x++) {
            const tile = board.tiles[y][x];
            if (tile.unit?.id === unitId) {
                return { x, y };
            }
        }
    }
    return null;
}

function removeUnitFromBoardById(unitId: string, board: BoardAsJson): void {
    for (let row of board.tiles) {
        for (let tile of row) {
            if (tile.unit?.id === unitId) {
                tile.unit = null;
                return;
            }
        }
    }
}

function setTileTypeAtPosition(
    position: PositionAsJson,
    tileType: TileType,
    board: BoardAsJson,
): void {
    const { x, y } = position;
    if (
        x < 0 ||
        y < 0 ||
        y >= board.tiles.length ||
        x >= board.tiles[y].length
    ) {
        return;
    }
    board.tiles[y][x].type = tileType;
}

export {
    getTileByPosition,
    getTileByUnitId,
    getPositionByUnitId,
    removeUnitFromBoardById,
    setTileTypeAtPosition,
};
