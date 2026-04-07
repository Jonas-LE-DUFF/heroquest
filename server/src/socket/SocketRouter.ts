import { authMiddleware } from "../middlewares/authMiddleware";
import { loggerMiddleware } from "../middlewares/loggerMiddleware";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { GameService } from "../services/GameService";
import { registerGameActionsHandlers } from "../handlers/gameActionsHandlers";
import { registerLobbyHandlers } from "../handlers/lobbyHandlers";
import { registerMovementHandlers } from "../handlers/movementsHandlers";
import { registerDiceHandlers } from "../handlers/diceHandler";
import { registerGameHandlers } from "../handlers/gamehandlers";
import { registerMasterHandlers } from "../handlers/masterHandlers";
import { Socket } from "socket.io";
import { emitGameStateUpdate } from "../utils/gameStateEmitter";

export function registerSocketHandlers(server: ServerHeroQuest) {
  const io = server.getIo();

  // Apply middlewares
  io.use(authMiddleware);
  io.use(loggerMiddleware);

  io.on("connection", (socket: Socket) => {
    console.log("Connected:", socket.id);

    // Register all handlers
    registerLobbyHandlers(socket);
    registerGameActionsHandlers(socket);
    registerMovementHandlers(socket);
    registerDiceHandlers(socket);
    registerGameHandlers(socket);
    registerMasterHandlers(socket);

    socket.on("disconnect", () => {
      const modifiedGames = GameService.removePlayerFromAllGames(socket.id);
      modifiedGames.forEach((game) => {
        emitGameStateUpdate(io, game.id, game);
      });
      console.log(
        `Disconnected player: ${socket.id} from games ${modifiedGames.map((g) => g.name).join(", ")}`,
      );
    });
  });
}
