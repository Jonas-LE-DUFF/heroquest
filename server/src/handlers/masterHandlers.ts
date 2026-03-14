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
import { Game } from "../POO/classes/Server/Game";

export function registerMasterHandlers(socket: Socket) {
  ///** game master actions **///
  // place-element
  socket.on(
    "place-element",
    withValidation(socket, placeElementSchema, (socket, data, callback) => {
      const { position: posData, selectedType, gameId } = data;
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

      const board = game?.gameState.board;
      if (!board) {
        console.error("Board not found in game state");
        return callback(errorResponse("Board not found"));
      }

      if (selectedType in Direction) {
        const direction = selectedType as Direction;
        const result = handleDoorPlacement(gameId, position, direction);
        if (!result.success) {
          return callback(errorResponse(result.error!));
        }
        return callback(successResponse());
      }

      if (selectedType === TileType.FLOOR) {
        game?.gameState.clearTileAtPosition(position);

        io.to(gameId).emit("game-state-update", {
          game: game!.toJson(),
        });
        return callback(successResponse());
      }

      const tile: Tile | undefined = board?.getTileAtPosition(position);
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

        if (tileType === TileType.SPAWN_POINT) {
          const existingSpawnPoint = board.getSpawnPointPosition();
          if (existingSpawnPoint) {
            removeSpawnPoint(existingSpawnPoint, game!);
          }
          const result = placeSpawnPoint(position, game!);
          if (!result.success) {
            if (existingSpawnPoint){
              placeSpawnPoint(existingSpawnPoint!, game!); // placing back the spawn point that was removed
            }
            return callback(errorResponse(result.error!));
          }
          return callback(successResponse(board.toJson()));
        }
        const result = handleTilePlacement(gameId, position, tileType);

        return callback(
          result.success ? successResponse() : errorResponse(result.error!),
        );
      }

      if (selectedType in MonsterCategory) {
        const monsterType = selectedType as MonsterCategory;
        const result = handleMonsterPlacement(gameId, position, monsterType);
        return callback(
          result.success ? successResponse() : errorResponse(result.error!),
        );
      }

      callback(errorResponse("Invalid element to place"));
    }),
  );

  socket.on(
    "update-stats-unit",
    withValidation(socket, updateStatsUnitSchema, (socket, data, callback) => {
      const { newStats, position: posData, gameId } = data;
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

      const unitId = game?.gameState.getUnitByPosition(position)?.id;
      if (!unitId) {
        return callback(
          errorResponse("Unit not found at the specified position"),
        );
      }

      const io = ServerHeroQuest.getServerInstance().getIo();

      io.to(gameId).emit("stats-updated", {
        entityId: unitId,
        newStats: newStats,
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
      error: newDoor.error || "Failed to place door",
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
  TileType: TileType,
): { success: boolean; error?: string } {
  console.debug("placing tile", TileType, "at position", position);
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
  tile.type = TileType;
  io.to(gameId).emit("tile-placed", {
    position: position,
    TileType: TileType,
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

  game!.gameState.addUnit(monster);
  game?.gameState.board.placeUnitAt(monster, position);

  io.to(gameId).emit("game-state-update", {
    game: game!.toJson(),
  });
  return { success: true };
}

function checkPositionFree(position: Position, game: Game): boolean {
  const tile = game.gameState.board.getTileAtPosition(position);
  if (!tile) {
    console.error("Tile not found at position:", position);
    return false;
  }
  if (tile.isOccupied()) {
    console.error("Tile is occupied at position:", position);
    return false;
  }
  if (tile.type !== TileType.FLOOR) {
    console.error("Tile is not a floor at position:", position);
    return false;
  }
  return true;
}
function checkSpawnPointPlacement(position: Position, game: Game): boolean {
  //checking if the tile for the spawn point and for 3 other tiles around it are free
  const tile1 = checkPositionFree(position, game);
  const tile2 = checkPositionFree(position.afterMove(Direction.DOWN), game);
  const tile3 = checkPositionFree(position.afterMove(Direction.RIGHT), game);
  const tile4 = checkPositionFree(
    position.afterMove(Direction.DOWN).afterMove(Direction.RIGHT),
    game,
  );
  return tile1 && tile2 && tile3 && tile4;
}
function placeSpawnPoint(
  position: Position,
  game: Game,
): { success: boolean; error?: string } {
  if (!checkSpawnPointPlacement(position, game)) {
    return { success: false, error: "Spawn point placement is not valid" };
  }
  const tile1 = game.gameState.board.getTileAtPosition(position);
  const tile2 = game.gameState.board.getTileAtPosition(
    position.afterMove(Direction.DOWN),
  );
  const tile3 = game.gameState.board.getTileAtPosition(
    position.afterMove(Direction.RIGHT),
  );
  const tile4 = game.gameState.board.getTileAtPosition(
    position.afterMove(Direction.DOWN).afterMove(Direction.RIGHT),
  );
  tile1!.type = TileType.SPAWN_POINT;
  tile2!.type = TileType.SPAWN_POINT;
  tile3!.type = TileType.SPAWN_POINT;
  tile4!.type = TileType.SPAWN_POINT;
  return { success: true };
}

function removeSpawnPoint(position: Position, game: Game): void {
  const tile1 = game.gameState.board.getTileAtPosition(position);
  const tile2 = game.gameState.board.getTileAtPosition(
    position.afterMove(Direction.DOWN),
  );
  const tile3 = game.gameState.board.getTileAtPosition(
    position.afterMove(Direction.RIGHT),
  );
  const tile4 = game.gameState.board.getTileAtPosition(
    position.afterMove(Direction.DOWN).afterMove(Direction.RIGHT),
  );
  tile1!.type = TileType.FLOOR;
  tile2!.type = TileType.FLOOR;
  tile3!.type = TileType.FLOOR;
  tile4!.type = TileType.FLOOR;
}
