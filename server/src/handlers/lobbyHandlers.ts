import { Server, Socket } from "socket.io";
import { GameService } from "../services/GameService";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { ServerToClientEvents } from "../POO/interfaces/Events/ServerToClientEvents";
import { Player } from "../POO/classes/Server/Player";
import { Game } from "../POO/classes/Server/Game";
import { requireGameExists } from "../guards/requireGameExists";
import { requireGameMaster } from "../guards/requireGameMaster";
import { Hero } from "../POO/classes/Units/Hero";

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
            if (!requireGameExists(data.gameId, gameService))
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

            if (!requireGameExists(data.gameId, gameService))
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

    socket.on(
        "choose-character",
        (
            data: {
                gameId: string;
                hero: Hero;
            },
            callback,
        ) => {
            const { gameId, hero } = data;

            if (!requireGameExists(gameId, gameService))
                return callback({ success: false, error: "Game not found." });

            const game = gameService.getGame(gameId);

            const player = game!.players.get(socket.id);
            if (!player) {
                return callback({ success: false, error: "Player not found." });
            }

            hero.controlledByPlayerId = socket.id;
            game?.gameState.addHero(hero);

            // Validate stats
            const isValid = hero.validateStats();
            if (!isValid.sucess) {
                return callback({ success: false, error: isValid.error });
            }
            hero.stats.movements = 2; // default movement value for heroes

            // Ensure game is in the lobby state
            if (game?.gameState.status !== "lobby") {
                return callback({
                    success: false,
                    error: "Cannot change character during the game.",
                });
            }

            // Check if the hero class is already selected
            if (game.gameState.isHeroCategoryTaken(hero.category)) {
                return callback({
                    success: false,
                    error: "Class already selected by another player.",
                });
            }

            // Validate spells
            const spellsTaken = game.gameState.getSpellsTaken(hero.spells);
            if (spellsTaken.length > 0) {
                return callback({
                    success: false,
                    error: `The spells ${spellsTaken.map((spell) => spell.name).join(", ")} are already selected by another player.`,
                });
            }

            player.isReady = true;

            io.to(gameId).emit("game-state-update", {
                game: game,
            });
            return callback({
                success: true,
                game: game,
            });
        },
    );

    //unselect-character
    socket.on(
        "unselect-character",
        (
            data: { gameId: string; heroId: string },
            callback: { success: boolean; message: string },
        ) => {
            const { gameId, heroId } = data;
            if (!requireGameExists(gameId, gameService)) return;

            const game = gameService.getGame(gameId);
            const player = game?.players.get(socket.id);
            if (!game || !player) return;

            const heroesControlled = game.gameState.getHeroesControlledByPlayer(
                socket.id,
            );

            const heroToRemove = heroesControlled.find((h) => h.id === heroId);
            if (!heroToRemove) return;
            game.gameState.removeUnit(heroToRemove);

            const heroesLeft = heroesControlled.filter((h) => h.id !== heroId);
            if (heroesLeft.length === 0) player.isReady = false;

            io.to(gameId).emit("game-state-update", {
                game: game,
            });
        },
    );
}
