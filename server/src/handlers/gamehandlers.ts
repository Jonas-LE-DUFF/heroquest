import { Server, Socket } from "socket.io";
import { requireGameMaster } from "../guards/requireGameMaster";
import { GameState } from "../POO/classes/GameState";
import { requirePlayerTurn } from "../guards/requirePlayerTurn";
import { GameService } from "../services/GameService";
import { requireGameExists } from "../guards/requireGameExists";

export function registerGameHandlers(
    socket: Socket,
    io: Server,
    gameService: GameService,
) {
    socket.on(
        "start-game",
        (
            data: { gameId: string },
            callback: (success: boolean, error?: string) => void,
        ) => {
            const game = gameService.getGame(data.gameId);
            if (!requireGameExists(data.gameId, gameService))
                return callback(false, "Partie non trouvée");

            // Use guard
            if (!requireGameMaster(socket, game!))
                return callback(
                    false,
                    "Seul le maître du jeu peut démarrer la partie",
                );

            // Business logic in service
            gameService.startGame(game!);

            io.to(data.gameId).emit("game-start", {
                gameState: GameState,
            });

            return callback(true);
        },
    );

    socket.on(
        "end-turn",
        (
            data: { gameId: string },
            callback: (success: boolean, error?: string) => void,
        ) => {
            const game = gameService.getGame(data.gameId);
            if (!requireGameExists(data.gameId, gameService))
                return callback(false, "Partie non trouvée");

            if (!requirePlayerTurn(socket, game!))
                return callback(false, "Ce n'est pas votre tour");

            gameService.endTurn(game!);

            io.to(data.gameId).emit("game-state-update", {
                gameState: GameState,
            });

            return callback(true);
        },
    );
}
