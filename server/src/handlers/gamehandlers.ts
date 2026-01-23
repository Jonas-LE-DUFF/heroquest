import { Server, Socket } from "socket.io";
import { requireGameMaster } from "../guards/requireGameMaster";
import { GameState } from "../POO/classes/GameState";
import { requirePlayerTurn } from "../guards/requirePlayerTurn";
import { GameService } from "../services/GameService";

export function registerGameHandlers(
    socket: Socket, 
    io: Server, 
    gameService: GameService
) {
    socket.on("start-game", (data: { gameId: string }) => {
        const game = gameService.getGame(data.gameId);
        if (!game) return socket.emit("error", "Partie non trouvée");
        
        // Use guard
        if (!requireGameMaster(socket, game)) return;
        
        // Business logic in service
        gameService.startGame(game);
        
        io.to(data.gameId).emit("game-start", {
            gameState: GameState
        });
    });

    socket.on("end-turn", (data: { gameId: string }) => {
        const game = gameService.getGame(data.gameId);
        if (!game) return;
        
        if (!requirePlayerTurn(socket, game)) return;
        
        gameService.endTurn(game);
        
        io.to(data.gameId).emit("game-state-update", {
            gameState: GameState
        });
    });
}