import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { logger } from "../utils/logger";

export function requireGameExists(gameId: string): boolean {
  const serverHeroQuest = ServerHeroQuest.getServerInstance();
  if (!serverHeroQuest.getGame(gameId)) {
    logger.error("Game not found with id:", gameId);
    return false;
  }
  return true;
}
