import { Socket } from "socket.io";
import { requireGameExists } from "../guards/requireGameExists";
import { requireGameMaster } from "../guards/requireGameMaster";
import { MonsterFactory } from "../POO/classes/Factories/MonsterFactory";
import { Position } from "../POO/classes/Position/Position";
import { Tile } from "../POO/classes/Tile";
import { MonsterCategory } from "../POO/enums/Categories/MonsterCategory";
import { Direction } from "../POO/enums/Direction";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { TileType } from "../POO/enums/TileType";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { GameService } from "../services/GameService";
import {
    withValidation,
    successResponse,
    errorResponse,
    toPosition,
    placeElementSchema,
    updateStatsUnitSchema,
} from "../validation";

export function registerMasterHandlers(socket: Socket) {
    ///** game master actions **///
    // place-element
    socket.on(
        "place-element",
        withValidation(placeElementSchema, (socket, data, callback) => {
            const { gameId, position: posData, selectedType } = data;
            const position = toPosition(posData);

            if (!requireGameExists(gameId)) {
                return callback(errorResponse("Game not found"));
            }

            if (!requireGameMaster(socket, GameService.getGame(gameId)!)) {
                return callback(errorResponse("You are not the game master"));
            }

            console.debug("placing element", data);
            const game = GameService.getGame(gameId);
            const io = ServerHeroQuest.getServerInstance().getIo();

            if (selectedType in Direction) {
                const direction = selectedType as Direction;
                const result = handleDoorPlacement(gameId, position, direction);
                return callback(
                    result.success
                        ? successResponse()
                        : errorResponse(result.error!),
                );
            }

            if (selectedType === TileType.FLOOR) {
                console.log("erasing tile at position:", position);
                game?.gameState.clearTileAtPosition(position);

                io.to(gameId).emit("game-state-update", {
                    game: game!,
                });
                return callback(successResponse());
            }

            const tile: Tile | undefined =
                game?.gameState?.board?.getTileAtPosition(position);
            if (tile === undefined) {
                console.error("tile couldn't be found on the board");
                return callback(errorResponse("Tile not found on board"));
            }

            if (tile.isOccupied()) {
                console.error("tile is occupied");
                return callback(errorResponse("Tile is occupied"));
            }

            if (selectedType in TileType) {
                const tileType = selectedType as TileType;
                const result = handleTilePlacement(gameId, position, tileType);
                return callback(
                    result.success
                        ? successResponse()
                        : errorResponse(result.error!),
                );
            }

            if (selectedType in MonsterCategory) {
                const monsterType = selectedType as MonsterCategory;
                const result = handleMonsterPlacement(
                    gameId,
                    position,
                    monsterType,
                );
                return callback(
                    result.success
                        ? successResponse()
                        : errorResponse(result.error!),
                );
            }

            callback(errorResponse("Invalid element to place"));
        }),
    );

    socket.on(
        "update-stats-unit",
        withValidation(updateStatsUnitSchema, (socket, data, callback) => {
            const { gameId, newStats, position: posData } = data;
            const position = toPosition(posData);

            if (!requireGameExists(gameId)) {
                return callback(errorResponse("Game not found"));
            }

            if (!requireGameMaster(socket, GameService.getGame(gameId)!)) {
                return callback(errorResponse("You are not the game master"));
            }

            const game = GameService.getGame(gameId);

            try {
                game?.gameState.updateUnitStats(newStats, position);
            } catch (error) {
                return callback(errorResponse((error as Error).message));
            }

            const io = ServerHeroQuest.getServerInstance().getIo();

            io.to(gameId).emit("stats-updated", {
                entityId: newStats.id,
                newStats: newStats,
                isPlayer: newStats.getRole() === PlayerRole.HERO,
            });

            callback(successResponse());
        }),
    );
}

function handleDoorPlacement(
    gameId: string,
    position: Position,
    direction: Direction,
): { success: boolean; error?: string } {
    const game = GameService.getGame(gameId);
    const io = ServerHeroQuest.getServerInstance().getIo();
    const newDoor = game!.gameState.board.placeDoor(position, direction);
    if (!newDoor.success) {
        return {
            success: false,
            error: "Invalid door placement",
        };
    }
    console.log("new door placed :", newDoor);
    io.to(gameId).emit("door-placed", {
        position: newDoor.doorPlace?.position!,
        verticalOrHorizontal: newDoor.doorPlace?.verticalOrHorizontal!,
    });
    return { success: true };
}

function handleTilePlacement(
    gameId: string,
    position: Position,
    tileType: TileType,
): { success: boolean; error?: string } {
    console.debug("placing tile", tileType, "at position", position);
    const game = GameService.getGame(gameId);
    const io = ServerHeroQuest.getServerInstance().getIo();
    const tile = game?.gameState?.board?.getTileAtPosition(position);
    if (!tile) {
        console.error("tile couldn't be found on the board");
        return {
            success: false,
            error: "Tile not found on board",
        };
    }
    tile.type = tileType;
    io.to(gameId).emit("tile-placed", {
        position: position,
        tileType: tileType,
    });
    return { success: true };
}

function handleMonsterPlacement(
    gameId: string,
    position: Position,
    monsterType: MonsterCategory,
): { success: boolean; error?: string } {
    const game = GameService.getGame(gameId);
    const io = ServerHeroQuest.getServerInstance().getIo();
    const monsterFactory = new MonsterFactory(gameId);
    const monster = monsterFactory.createMonster(monsterType);

    game!.gameState.addMonster(monster);
    game!.gameState.board.placeUnitAt(monster, position);

    io.to(gameId).emit("game-state-update", {
        game: game!,
    });
    return { success: true };
}
