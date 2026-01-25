import { authMiddleware } from "../middlewares/authMiddleware";
import { loggerMiddleware } from "../middlewares/loggerMiddleware";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { GameService } from "../services/GameService";
import { registerGameHandlers } from "../handlers/gamehandlers";
import { registerLobbyHandlers } from "../handlers/lobbyHandlers";

export function registerSocketHandlers(server: ServerHeroQuest) {
    const { io } = server;
    const gameService = new GameService();

    // Apply middlewares
    io.use(authMiddleware);
    io.use(loggerMiddleware);

    io.on("connection", (socket) => {
        console.log("Connected:", socket.id);

        // Register all handlers
        registerLobbyHandlers(socket, io, gameService);
        registerGameHandlers(socket, io, gameService);
        registerMovementHandlers(socket, io, gameService);
        registerCombatHandlers(socket, io, gameService);
        registerMasterHandlers(socket, io, gameService);
        registerConnectionHandler(socket, io, gameService);

        socket.on("disconnect", () => {
            const modifiedGames = gameService.removePlayerFromAllGames(socket.id);
            modifiedGames.forEach(game => {
                io.emit("game-state-update", { game: game });
            });
            console.log(`Disconnected player: ${socket.id} from games ${modifiedGames.map(g => g.name).join(", ")}`);
        });
    });
}
