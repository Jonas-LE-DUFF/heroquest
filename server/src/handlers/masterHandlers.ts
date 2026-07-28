import { Socket } from "socket.io";
import { requireGameExists } from "../guards/requireGameExists";
import { requireGameMaster } from "../guards/requireGameMaster";
import { MonsterFactory } from "../POO/classes/Factories/MonsterFactory";
import { Position } from "../POO/classes/Position/Position";
import { Tile } from "../POO/classes/Board/Tile/Tile";
import { MonsterCategory } from "../POO/enums/Categories/MonsterCategory";
import { Direction } from "../POO/enums/Direction";
import { TileType } from "../POO/enums/Board/TileType";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { GameService } from "../services/GameService";
import { emitGameStateUpdate } from "../utils/gameStateEmitter";
import {
  withValidation,
  successResponse,
  errorResponse,
  toPosition,
  placeElementSchema,
  updateStatsUnitSchema,
  grantSpellSchema,
} from "../validation";
import { Game } from "../POO/classes/Server/Game";
import { TrapType } from "../POO/enums/Board/TrapType";
import { Stats } from "../POO/classes/Units/Stats";
import { checkUnitDefeat } from "../shared/death/death";
import { logger } from "../utils/logger";

export function registerMasterHandlers(socket: Socket) {
  ///** game master actions **///
  // place-element
  socket.on(
    "place-element",
    withValidation(socket, placeElementSchema, (socket, data, callback) => {
      const { position: posData, selectedType, gameId, playerId } = data;
      const position = toPosition(posData);

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Game not found"));
      }

      if (!requireGameMaster(playerId, GameService.getGame(gameId)!)) {
        return callback(errorResponse("You are not the game master"));
      }

      if (!selectedType) {
        return callback(errorResponse("Selected type is required"));
      }

      logger.debug("placing element", data);
      const game = GameService.getGame(gameId);

      const board = game?.gameState.board;
      if (!board) {
        logger.error("Board not found in game state");
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

        const io = ServerHeroQuest.getServerInstance().getIo();
        emitGameStateUpdate(io, gameId, game);
        return callback(successResponse());
      }

      const tile: Tile | undefined = board?.getTileAtPosition(position);
      if (tile === undefined) {
        logger.error("tile couldn't be found on the board");
        return callback(errorResponse("Tile not found on board"));
      }

      if (tile.isOccupied()) {
        logger.error("tile is occupied");
        return callback(errorResponse("Tile is occupied"));
      }

      if (selectedType in TileType) {
        const tileType = selectedType as TileType;

        if (tileType === TileType.SPAWN_POINT) {
          const existingSpawnPoint = board.getSpawnPointPosition();
          if (existingSpawnPoint) {
            removeSpawnPoint(existingSpawnPoint, game);
          }
          const result = placeSpawnPoint(position, game);
          if (!result.success) {
            if (existingSpawnPoint) {
              placeSpawnPoint(existingSpawnPoint, game); // placing back the spawn point that was removed
            }
            return callback(errorResponse(result.error!));
          }
          return callback(successResponse(board.toJson(true)));
        }
        const result = handleTilePlacement(gameId, position, tileType);

        return callback(
          result.success
            ? successResponse(board.toJson(true))
            : errorResponse(result.error!),
        );
      }

      if (selectedType in MonsterCategory) {
        const monsterType = selectedType as MonsterCategory;
        const result = handleMonsterPlacement(gameId, position, monsterType);
        return callback(
          result.success
            ? successResponse(board.toJson(true))
            : errorResponse(result.error!),
        );
      }

      if (selectedType in TrapType) {
        logger.debug("placing trap", selectedType, "at position", position);
        const trapType = selectedType as TrapType;
        const result = handleTrapPlacement(gameId, position, trapType);
        return callback(
          result.success
            ? successResponse(board.toJson(true))
            : errorResponse(result.error!),
        );
      }

      callback(errorResponse("Invalid element to place"));
    }),
  );

  socket.on(
    "update-stats-unit",
    withValidation(socket, updateStatsUnitSchema, (socket, data, callback) => {
      const { newStats, unitId, gameId, playerId } = data;

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Game not found"));
      }

      if (!requireGameMaster(playerId, GameService.getGame(gameId)!)) {
        return callback(errorResponse("You are not the game master"));
      }

      const game = GameService.getGame(gameId);

      const unit = game?.gameState.getUnitById(unitId);
      if (!unit) {
        logger.error("Unit not found with id:", unitId);
        return callback(errorResponse("Unit not found"));
      }

      const adaptedStats: Stats = {
        health: newStats.health,
        maxHealth: newStats.maxHealth,
        nbDefenseDice: newStats.defense,
        movements: newStats.movements,
        spirit: newStats.spirit,
      };
      unit.stats = adaptedStats;
      const io = ServerHeroQuest.getServerInstance().getIo();

      if (unit.stats.health <= 0) {
        const defeated = checkUnitDefeat(game!.id, unit);
        if (defeated) {
          emitGameStateUpdate(io, gameId, game!);
          return callback(successResponse());
        }
      }

      //TODO : handle effects

      io.to(gameId).emit("stats-updated", {
        entityId: unitId,
        newStats: newStats,
      });

      callback(successResponse());
    }),
  );

  socket.on(
    "grant-back-spell",
    withValidation(socket, grantSpellSchema, (socket, data, callback) => {
      const { gameId, playerId, heroId, spellId } = data;
      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Game not found"));
      }
      if (!requireGameMaster(playerId, GameService.getGame(gameId)!)) {
        return callback(errorResponse("You are not the game master"));
      }

      const game = GameService.getGame(gameId)!;
      const hero = game.getHeroes().find((h) => h.id === heroId);
      if (!hero) {
        return callback(errorResponse("Hero not found"));
      }

      const spell = hero.usedSpells.find((spell) => spell.id === spellId);
      if (!spell) {
        return callback(errorResponse("Spell not found in hero used spells"));
      }

      hero.unuseSpell(spell);

      const io = ServerHeroQuest.getServerInstance().getIo();
      emitGameStateUpdate(io, gameId, game);

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
  if (
    !newDoor.success ||
    !newDoor.doorPlace?.position ||
    !newDoor.doorPlace?.verticalOrHorizontal
  ) {
    return {
      success: false,
      error: newDoor.error || "Failed to place door",
    };
  }
  io.to(gameId).emit("door-placed", {
    position: newDoor.doorPlace.position,
    verticalOrHorizontal: newDoor.doorPlace.verticalOrHorizontal,
  });
  return { success: true };
}

//TODO : refactor all the following functions and put them in a dedicated service, the GameService is not the right place for them

function handleTilePlacement(
  gameId: string,
  position: Position,
  TileType: TileType,
): { success: boolean; error?: string } {
  logger.debug("placing tile", TileType, "at position", position);
  const game = GameService.getGame(gameId);
  const io = ServerHeroQuest.getServerInstance().getIo();
  const tile = game?.gameState?.board?.getTileAtPosition(position);
  if (!tile) {
    logger.error("tile couldn't be found on the board");
    return {
      success: false,
      error: "Tile not found on board",
    };
  }
  tile.type = TileType;
  emitGameStateUpdate(io, gameId, game!);
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

  emitGameStateUpdate(io, gameId, game!);
  return { success: true };
}

function handleTrapPlacement(
  gameId: string,
  position: Position,
  trapType: TrapType,
): { success: boolean; error?: string } {
  const game = GameService.getGame(gameId);
  const io = ServerHeroQuest.getServerInstance().getIo();

  try {
    game?.gameState.board.placeTrap(gameId, position, trapType);
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || "Failed to place trap",
    };
  }
  logger.debug(
    "placed trap",
    trapType,
    "resulting game state:",
    game?.gameState.board.getTileAtPosition(position),
  );
  emitGameStateUpdate(io, gameId, game!);
  return { success: true };
}

function checkPositionFree(position: Position, game: Game): boolean {
  const tile = game.gameState.board.getTileAtPosition(position);
  if (!tile) {
    logger.error("Tile not found at position:", position);
    return false;
  }
  if (tile.isOccupied()) {
    logger.error("Tile is occupied at position:", position);
    return false;
  }
  if (tile.type !== TileType.FLOOR) {
    logger.error("Tile is not a floor at position:", position);
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
