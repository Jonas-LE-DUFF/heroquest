import { Server } from "socket.io";
import { Game } from "../POO/classes/Server/Game";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { ServerToClientEvents } from "../POO/interfaces/Events/ServerToClientEvents";
import { ClientToServerEvents } from "../POO/interfaces/Events/ClientToServerEvents";

/**
 * Emits the game state to all players in a game.
 * Game masters see all traps (revealed or not)
 * Regular players only see revealed traps
 *
 * @param io The Socket.IO server instance
 * @param gameId The ID of the game
 * @param game The game instance
 */
export function emitGameStateUpdate(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  gameId: string,
  game: Game,
): void {
  const room = io.sockets.adapter.rooms.get(gameId);

  if (!room) {
    console.warn(
      `No sockets found in room ${gameId} when trying to emit game state update`,
    );
    return;
  }

  // Send to each socket individually with the appropriate filtering
  for (const socketId of room) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) continue;

    const player = game.getPlayer(socket.id);
    const isGameMaster = player?.role === PlayerRole.GAME_MASTER;

    socket.emit("game-state-update", {
      game: game.toJson(isGameMaster),
    });
  }
}

export function getGameMasterSocket(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  game: Game,
) {
  const room = io.sockets.adapter.rooms.get(game.id);

  if (!room) {
    console.warn(
      `No sockets found in room ${game.id} when trying to get game master socket`,
    );
    return null;
  }

  for (const socketId of room) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) continue;

    const gameMaster = game.getGameMaster();
    if (gameMaster.socketId === socketId) {
      return socket;
    }
  }

  console.warn(`No game master found in game ${game.id}`);
  return null;
}
