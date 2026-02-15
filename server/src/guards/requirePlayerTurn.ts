import { Socket } from "socket.io";
import { Game } from "../POO/classes/Server/Game";

export function requirePlayerTurn(socket: Socket, game: Game): boolean {
  let currentPlayerTurnId: string | undefined;
  try {
    currentPlayerTurnId = game.getCurrentPlayerTurnId();
  } catch (error) {
    console.error("Error getting current player turn ID:", error);
    return false;
  }
  if (currentPlayerTurnId === undefined) {
    return false;
  }
  if (
    currentPlayerTurnId !== socket.id &&
    game.getGameMaster()?.id !== socket.id
  ) {
    return false;
  }
  return true;
}
