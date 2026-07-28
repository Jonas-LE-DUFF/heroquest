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
import { registerTrapsActionsHandlers } from "../handlers/trapsActionsHandlers";
import { randomUUID } from "crypto";
import { logger } from "../utils/logger";

async function restoreSession(socket: Socket, sessionToken: string) {
  const server = ServerHeroQuest.getServerInstance();
  const io = server.getIo();
  const sessionStore = server.getSessionStore();

  logger.info("Attempting to restore session for token:", sessionToken);

  const existingSession = sessionStore.findByToken(sessionToken);

  if (existingSession) {
    logger.info(
      `Restoring session for player ${existingSession.playerId} in game ${existingSession.gameId}`,
    );
    if (!existingSession.gameId || !existingSession.playerId) {
      logger.error(
        `Invalid session data for token ${sessionToken}: missing gameId or playerId`,
      );
      return;
    }

    const game = server.getGame(existingSession.gameId);
    const player = game?.getPlayer(existingSession.playerId);

    if (game && player) {
      player.socketId = socket.id; // Update player ID to the new socket ID
      await socket.join(existingSession.gameId);
      logger.info(`Player ${player.name} reconnected to game ${game.name}`);
      emitGameStateUpdate(io, game.id, game);
      return;
    }
    logger.error(
      `Failed to restore session: game or player not found for session token ${sessionToken}`,
    );
  }
}

export function registerSocketHandlers(server: ServerHeroQuest) {
  const io = server.getIo();
  const sessionStore = server.getSessionStore();

  // Apply middlewares
  io.use(loggerMiddleware);

  io.on("connection", async (socket: Socket) => {
    const sessionToken =
      (socket.handshake.auth.sessionToken as string) ?? randomUUID();

    await restoreSession(socket, sessionToken);

    socket.emit("session", { sessionToken });
    sessionStore.save({ sessionToken, playerId: null, gameId: null }); // Save session with null values until player joins a game
    logger.info("Connected:", socket.id);
    socket.handshake.auth.sessionToken = sessionToken;

    // Register all handlers
    registerLobbyHandlers(socket);
    registerGameActionsHandlers(socket);
    registerMovementHandlers(socket);
    registerDiceHandlers(socket);
    registerGameHandlers(socket);
    registerMasterHandlers(socket);
    registerTrapsActionsHandlers(socket);

    socket.on("disconnect", () => {
      const modifiedGames = GameService.removePlayerFromAllGames(socket.id);
      modifiedGames.forEach((game) => {
        emitGameStateUpdate(io, game.id, game);
      });
      logger.info(
        `Disconnected player: ${socket.id} from games ${modifiedGames.map((g) => g.name).join(", ")}`,
      );
    });
  });
}
