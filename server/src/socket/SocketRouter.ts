import { Socket, Server } from "socket.io";
import { authMiddleware } from "../middlewares/authMiddleware";
import { loggerMiddleware } from "../middlewares/loggerMiddleware";
import { ClientToServerEvents } from "../POO/interfaces/Events/ClientToServerEvents";
import { ServerToClientEvents } from "../POO/interfaces/Events/ServerToClientEvents";
import { SocketData } from "../POO/interfaces/Socket/SocketData";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { GameService } from "../services/GameService";

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
    });
}
