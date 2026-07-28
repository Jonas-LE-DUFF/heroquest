import { Game } from "../POO/classes/Server/Game";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { logger } from "../utils/logger";

export function requireGameMaster(playerId: string, game: Game): boolean {
  const player = game.getPlayer(playerId);
  if (player?.role !== PlayerRole.GAME_MASTER) {
    logger.error("error : Only the game-master can make this action");
    return false;
  }
  return true;
}
