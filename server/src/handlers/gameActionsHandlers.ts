import { Socket } from "socket.io";
import { requireGameExists } from "../guards/requireGameExists";
import { requirePlayerTurn } from "../guards/requirePlayerTurn";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { fight } from "../services/CombatService";
import { GameService } from "../services/GameService";
import {
  withValidation,
  successResponse,
  errorResponse,
  toPosition,
  castSpellSchema,
  attackSchema,
} from "../validation";

export function registerGameActionsHandlers(socket: Socket) {
  ///** common player and game master actions **///

  // cast-spell
  socket.on(
    "cast-spell",
    withValidation(socket, castSpellSchema, async (socket, data, callback) => {
      console.debug("casting spell", data);
      const { gameId, spellId, position } = data;
      const game = GameService.getGame(gameId);

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("game couldn't be found in cast-spell"));
      }

      if (!requirePlayerTurn(socket, game!)) {
        return callback(
          errorResponse("it's not your turn to play in cast-spell"),
        );
      }

      try {
        const castingPlayer = game!.getCurrentPlayerTurn();
        console.debug("spell cast by player", castingPlayer?.name);
      } catch (error) {
        return callback(
          errorResponse(
            "player casting spell couldn't be found : " +
              (error as Error).message,
          ),
        );
      }

      const heroCaster = game!.getCurrentHeroTurn();
      const spellToCast = heroCaster.getSpellById(spellId);
      const targetUnit = game!
        .getGameState()
        .board.getUnitAt(toPosition(position));

      if (!spellToCast || !targetUnit) {
        return callback(errorResponse("spell or target unit not found"));
      }

      heroCaster.castSpell(spellToCast, targetUnit);

      const io = ServerHeroQuest.getServerInstance().getIo();

      io.to(gameId).emit("game-state-update", {
        game: game!.toJson(),
      });

      callback(successResponse());
    }),
  );

  socket.on(
    "attack",
    withValidation(socket, attackSchema, async (socket, data, callback) => {
      const { gameId, attackerId, targetId, wishedNumberOfDices } = data;

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("game couldn't be found in attack"));
      }

      const game = GameService.getGame(gameId);

      const attacker = game!.getGameState().getUnitById(attackerId);
      const defender = game!.getGameState().getUnitById(targetId);

      if (!attacker || !defender) {
        return callback(
          errorResponse("attacker or defender not found in attack"),
        );
      }

      fight(socket, game!, attacker, defender, wishedNumberOfDices);
      callback(successResponse());
    }),
  );
}
