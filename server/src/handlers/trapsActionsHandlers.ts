import { Socket } from "socket.io";
import {
  disarmTrapSchema,
  errorResponse,
  heroActionSchema,
  revealTrapSchema,
  successResponse,
  withValidation,
} from "../validation";
import { requireGameExists } from "../guards/requireGameExists";
import { GameService } from "../services/GameService";
import { requirePlayerTurn } from "../guards/requirePlayerTurn";
import {
  emitGameStateUpdate,
  getGameMasterSocket,
} from "../utils/gameStateEmitter";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { FightDiceFaces } from "../POO/enums/Dices/FightDiceFaces";
import { dealDamage } from "../services/CombatService";
import { Position } from "../POO/classes/Position/Position";
import { requireGameMaster } from "../guards/requireGameMaster";
import { DiceServiceRegistry } from "../services/DiceServiceRegistry";
import { logger } from "../utils/logger";

function registerTrapsActionsHandlers(socket: Socket) {
  checkForTraps(socket);
  disarmTrap(socket);
  revealTrap(socket);
}

function checkForTraps(socket: Socket) {
  socket.on(
    "check-for-traps",
    withValidation(socket, heroActionSchema, (socket, data, callback) => {
      const { gameId, playerId, heroId } = data;
      logger.info(`Checking for traps in game ${gameId} for hero ${heroId}`);
      if (!requireGameExists(gameId)) {
        return callback(errorResponse("La partie n'existe plus."));
      }

      const game = GameService.getGame(gameId);

      if (!requirePlayerTurn(playerId, game!)) {
        return callback(errorResponse("Ce n'est pas votre tour."));
      }

      const io = ServerHeroQuest.getServerInstance().getIo();

      const gameMasterSocket = getGameMasterSocket(io, game!);

      gameMasterSocket?.emit("player-search", {
        heroId,
        playerId: socket.id,
        elementSearched: "traps",
      });
      return callback(
        successResponse({ message: `request sent to game master` }),
      );
    }),
  );
}

function disarmTrap(socket: Socket) {
  socket.on(
    "disarm-trap",
    withValidation(socket, disarmTrapSchema, (socket, data, callback) => {
      const { gameId, playerId, heroId } = data;

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("La partie n'existe plus."));
      }

      const game = GameService.getGame(gameId);

      const position = new Position(data.position.x, data.position.y);
      if (
        !position.isValid(
          game!.gameState.board.BOARD_WIDTH,
          game!.gameState.board.BOARD_HEIGHT,
        )
      ) {
        return callback(errorResponse("Position invalide."));
      }
      const tile = game!.gameState.board.getTileAtPosition(position);
      if (!tile || !tile.trap || !tile.trap.isRevealed) {
        return callback(errorResponse("Aucun piège trouvé à cette position."));
      }
      if (tile.trap.hasBeenTriggered) {
        return callback(
          errorResponse(
            "Le piège a déjà été déclenché et ne peut plus être désarmé.",
          ),
        );
      }

      if (!requirePlayerTurn(playerId, game!)) {
        return callback(errorResponse("Ce n'est pas votre tour."));
      }

      const hero = game!.gameState.getHeroById(heroId);

      if (!hero) {
        return callback(errorResponse("Héros introuvable."));
      }

      if (
        hero.equipment.tools.length <= 0 &&
        hero.getCategory() !== HeroCategory.Dwarf
      ) {
        return callback(
          errorResponse(
            "Le héros ne peut pas désarmer le piège car il ne possède pas d'outils appropriés et qu'il n'est pas nain.",
          ),
        );
      }

      const dice = DiceServiceRegistry.get();
      dice.rollDice({
        gameId,
        wishedNumberOfDices: 1,
        playerId: hero.id,
        kind: "fight",
        callback: (results) => {
          const result = results[0];
          if (hero.getCategory() !== HeroCategory.Dwarf) {
            if (result === FightDiceFaces.Hit) {
              dealDamage(gameId, hero, 1);
            } else {
              tile.trap = null;
            }
          } else {
            if (result === FightDiceFaces.BlackShield) {
              dealDamage(gameId, hero, 1);
            } else {
              tile.trap = null;
            }
          }
          logger.info(
            `Hero ${hero.name} attempted to disarm trap at position (${position.x}, ${position.y}) with roll result: ${result}`,
          );

          const io = ServerHeroQuest.getServerInstance().getIo();

          emitGameStateUpdate(io, gameId, game!);

          return callback(successResponse());
        },
      });
    }),
  );
}

function revealTrap(socket: Socket) {
  socket.on(
    "reveal-trap",
    withValidation(socket, revealTrapSchema, (socket, data, callback) => {
      logger.info("Received reveal trap request with data:", data);
      const { gameId, playerId, position } = data;
      if (!requireGameExists(gameId)) {
        return callback(errorResponse("La partie n'existe plus."));
      }
      const game = GameService.getGame(gameId);
      if (!requireGameMaster(playerId, game!)) {
        return callback(
          errorResponse("Seul le maître du jeu peut faire cela."),
        );
      }
      const pos = new Position(position.x, position.y);
      if (
        !pos.isValid(
          game!.gameState.board.BOARD_WIDTH,
          game!.gameState.board.BOARD_HEIGHT,
        )
      ) {
        return callback(errorResponse("Position invalide."));
      }
      const tile = game!.gameState.board.getTileAtPosition(pos);
      if (!tile) {
        return callback(
          errorResponse("Aucune tuile trouvée à cette position."),
        );
      }

      if (!tile.trap) {
        return callback(errorResponse("Aucun piège trouvé à cette position."));
      }

      tile.trap.isRevealed = true;
      logger.info(
        `Trap at position (${position.x}, ${position.y}) revealed by game master.`,
      );

      const io = ServerHeroQuest.getServerInstance().getIo();
      emitGameStateUpdate(io, gameId, game!);
      return callback(successResponse());
    }),
  );
}

export { registerTrapsActionsHandlers };
