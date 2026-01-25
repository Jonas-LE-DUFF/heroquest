import { Server, Socket } from "socket.io";
import { GameService } from "../services/GameService";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { ServerToClientEvents } from "../POO/interfaces/Events/ServerToClientEvents";
import { ClientToServerEvents } from "../POO/interfaces/Events/ClientToServerEvents";
import { Player } from "../POO/classes/Server/Player";
import { Game } from "../POO/classes/Server/Game";
import {
    requireGameExists,
    requireGameExistsGameService,
} from "../guards/requireGameExists";
import { positionKey } from "../shared/util";
import { requireGameMaster } from "../guards/requireGameMaster";

export function registerLobbyHandlers(
    socket: Socket,
    io: Server<ServerToClientEvents>,
    gameService: GameService,
) {
    socket.on(
        "join-game",
        (
            data: { gameName: string; playerName: string; role: PlayerRole },
            callback: (success: boolean, error?: string, game?: Game) => void,
        ) => {
            const { gameName, playerName, role } = data;
            console.log("gameName : ", gameName, "playerName : ", playerName);

            if (!gameName || !playerName || !role) {
                return callback(false, "Données manquantes");
            }

            const isThereGame: boolean = gameService.hasGame(gameName);
            let game: Game;

            const newPlayer = new Player(data.playerName, role);

            if (!isThereGame) {
                game = gameService.createGame(gameName, newPlayer);
            } else {
                game = gameService.getGameByName(gameName)!;
                game.addPlayer(newPlayer);
            }

            socket.join(game.id);

            io.to(game.id).emit("game-state-update", {
                game: game,
            });

            console.log(`${playerName} a rejoint la partie ${game.id}`);

            return callback(true, undefined, game);
        },
    );

    socket.on(
        "leave-lobby",
        (
            data: { gameId: string },
            callback: (success: boolean, error?: string) => void,
        ) => {
            if (!requireGameExistsGameService(data.gameId, gameService))
                return callback(false, "Partie non trouvée");

            const game = gameService.getGame(data.gameId);

            game!.removePlayer(socket.id);

            socket.leave(data.gameId);

            console.log("Utilisateur déconnecté:", socket.id);

            if (game!.players.size === 0) {
                console.log(
                    "Suppression de la partie vide avec l'id :",
                    game!.id,
                );
                gameService.removeGame(game!.id);
            }

            // we shouldn't have to remove that many informations but just making sure
            io.to(data.gameId).emit("game-state-update", {
                game: game!,
            });
            return callback(true);
        },
    );

    socket.on(
        "start-game",
        (
            data: { gameId: string },
            callback: (success: boolean, error?: string) => void,
        ) => {
            console.log("Demande de démarrage pour la partie:", data.gameId);

            if (!requireGameExistsGameService(data.gameId, gameService))
                return callback(false, "Partie non trouvée");

            if (!requireGameMaster(socket, gameService.getGame(data.gameId)!))
                return callback(false, "Utilisateur non autorisé");

            const game = gameService.getGame(data.gameId);

            try {
                gameService.startGame(game!);
            } catch (error: any) {
                console.log(
                    "Erreur lors du lancement de la partie :",
                    error.message,
                );
                return callback(false, error.message);
            }

            console.log("Conditions remplies, lancement de la partie...");

            io.to(data.gameId).emit("game-start", {
                game: game!,
            });
            return callback(true);
        },
    );
}
