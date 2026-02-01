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
} from "../validation";

export function registerGameHandlers(socket: Socket) {
    socket.on(
        "start-game",
        withValidation(socket, gameIdSchema, (socket, data, callback) => {
            const { gameId } = data;
            const game = GameService.getGame(gameId);

            if (!requireGameExists(gameId)) {
                return callback(errorResponse("Partie non trouvée"));
            }

            if (!requireGameMaster(socket, game!)) {
                return callback(
                    errorResponse(
                        "Seul le maître du jeu peut démarrer la partie",
                    ),
                );
            }

            game!.launchGame();

            const io = ServerHeroQuest.getServerInstance().getIo();

            io.to(gameId).emit("game-start", {
                game: game!.toJson(),
            });

            callback(successResponse());
        }),
    );

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
}
