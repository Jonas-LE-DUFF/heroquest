import { Socket } from "socket.io";
import {
  checkForTrapsSchema,
  disarmTrapSchema,
  errorResponse,
  successResponse,
  withValidation,
} from "../validation";
import { requireGameExists } from "../guards/requireGameExists";
import { GameService } from "../services/GameService";
import { requirePlayerTurn } from "../guards/requirePlayerTurn";
import { emitGameStateUpdate, getGameMasterSocket } from "../utils/gameStateEmitter";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { success } from "zod";
import { rollFightDice } from "../services/DiceService";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { FightDiceFaces } from "../POO/enums/Dices/FightDiceFaces";
import { dealDamage } from "../services/CombatService";
import { Position } from "../POO/classes/Position/Position";

function registerTrapsActionsHandlers(socket: Socket) {
  checkForTraps(socket);
  disarmTrap(socket);
}

function checkForTraps(socket: Socket) {
  socket.on(
    "check-for-traps",
    withValidation(
      socket,
      checkForTrapsSchema,
      async (socket, data, callback) => {
        const { gameId, heroId } = data;
        console.log(`Checking for traps in game ${gameId} for hero ${heroId}`);
        if (!requireGameExists(gameId)) {
          return callback(errorResponse("La partie n'existe plus."));
        }

        const game = GameService.getGame(gameId);

        if (!requirePlayerTurn(socket, game!)) {
          return callback(errorResponse("Ce n'est pas votre tour."));
        }

        const io = ServerHeroQuest.getServerInstance().getIo();

        const gameMasterSocket = getGameMasterSocket(io, game!);

        gameMasterSocket?.emit("player-searching-for-traps", {
          heroId,
          playerId: socket.id,
        });
        return callback({ success: true });
      },
    ),
  );
}

function disarmTrap(socket: Socket) {
  socket.on(
    "disarm-trap",
    withValidation(socket, disarmTrapSchema, async (socket, data, callback) => {
      const { gameId, heroId } = data;

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

      if (!requirePlayerTurn(socket, game!)) {
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
          errorResponse("Le héros ne peut pas désarmer le piège."),
        );
      }

      const roll = await rollFightDice(gameId, 1, PlayerRole.HERO);
      if (!roll.success) {
        return callback(
          errorResponse("Une erreur est survenue lors du lancer de dés."),
        );
      }
      const result = roll.results![0];
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

      const io = ServerHeroQuest.getServerInstance().getIo();

      emitGameStateUpdate(io, gameId, game!);

      return callback(successResponse());
    }),
  );
}

export { registerTrapsActionsHandlers };
