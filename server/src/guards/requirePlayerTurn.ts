import { Game } from "../POO/classes/Server/Game";
import { logger } from "../utils/logger";

export function requirePlayerTurn(playerId: string, game: Game): boolean {
  let currentPlayerTurnId: string | undefined;
  try {
    currentPlayerTurnId = game.getCurrentPlayerTurnId();
  } catch (error) {
    logger.error("Error getting current player turn ID:", error);
    return false;
  }
  if (currentPlayerTurnId === undefined) {
    return false;
  }
  if (
    currentPlayerTurnId !== playerId &&
    game.getGameMaster()?.id !== playerId
  ) {
    return false;
  }
  return true;
}
