import { Socket } from "socket.io";
import { requireGameMaster } from "../guards/requireGameMaster";
import { requirePlayerTurn } from "../guards/requirePlayerTurn";
import { GameService } from "../services/GameService";
import { requireGameExists } from "../guards/requireGameExists";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { emitGameStateUpdate } from "../utils/gameStateEmitter";
import {
  successResponse,
  errorResponse,
  withValidation,
  updateEquipmentSchema,
  gameIdSchema,
} from "../validation";

export function registerGameHandlers(socket: Socket) {
  socket.on(
    "end-turn",
    withValidation(socket, gameIdSchema, (socket, data, callback) => {
      const { gameId, playerId } = data;
      const game = GameService.getGame(gameId);

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Partie non trouvée"));
      }

      if (!requirePlayerTurn(playerId, game!)) {
        return callback(errorResponse("Ce n'est pas votre tour"));
      }

      game!.endTurn();

      const io = ServerHeroQuest.getServerInstance().getIo();

      emitGameStateUpdate(io, gameId, game!);

      callback(successResponse());
    }),
  );

  socket.on(
    "updateEquipment",
    withValidation(socket, updateEquipmentSchema, (socket, data, callback) => {
      const { gameId, playerId } = data;
      const game = GameService.getGame(gameId);

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Partie non trouvée"));
      }
      if (!requireGameMaster(playerId, game!)) {
        return callback(errorResponse("Seul le maître du jeu peut faire cela"));
      }

      const { equipment, heroId, gold } = data;

      game!.updateHeroEquipment(heroId, equipment, gold);
      const io = ServerHeroQuest.getServerInstance().getIo();
      emitGameStateUpdate(io, gameId, game!);
      callback(successResponse());
    }),
  );
}
