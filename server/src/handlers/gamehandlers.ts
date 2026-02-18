import { Socket } from "socket.io";
import { requireGameMaster } from "../guards/requireGameMaster";
import { requirePlayerTurn } from "../guards/requirePlayerTurn";
import { GameService } from "../services/GameService";
import { requireGameExists } from "../guards/requireGameExists";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import {
  successResponse,
  errorResponse,
  withValidation,
  gameIdSchema,
  updateEquipmentSchema,
} from "../validation";

export function registerGameHandlers(socket: Socket) {
  socket.on(
    "end-turn",
    withValidation(socket, gameIdSchema, (socket, data, callback) => {
      const { gameId } = data;
      const game = GameService.getGame(gameId);

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Partie non trouvée"));
      }

      if (!requirePlayerTurn(socket, game!)) {
        return callback(errorResponse("Ce n'est pas votre tour"));
      }

      game!.endTurn();

      const io = ServerHeroQuest.getServerInstance().getIo();

      io.to(gameId).emit("game-state-update", {
        game: game!.toJson(),
      });

      callback(successResponse());
    }),
  );

  socket.on(
    "updateEquipment",
    withValidation(socket, updateEquipmentSchema, (socket, data, callback) => {
      const { gameId } = data;
      const game = GameService.getGame(gameId);

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Partie non trouvée"));
      }
      if (!requireGameMaster(socket, game!)) {
        return callback(errorResponse("Seul le maître du jeu peut faire cela"));
      }

      const { equipment, heroId } = data;

      game!.updateHeroEquipment(heroId, equipment);
      const io = ServerHeroQuest.getServerInstance().getIo();
      io.to(gameId).emit("game-state-update", {
        game: game!.toJson(),
      });
      callback(successResponse());
    }),
  );
}
