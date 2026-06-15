import { Game } from "../POO/classes/Server/Game";
import { PlayerRole } from "../POO/enums/PlayerRole";

export function requireGameMaster(playerId: string, game: Game): boolean {
  const player = game.getPlayer(playerId);
  if (player?.role !== PlayerRole.GAME_MASTER) {
    console.error("error : Only the game-master can make this action");
    return false;
  }
  return true;
}
