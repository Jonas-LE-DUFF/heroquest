import { Socket } from "socket.io";
import { Game } from "../POO/classes/Server/Game";

export function requirePlayerTurn(socket: Socket, game: Game): boolean {
  const currentPlayerTurnId = game.getCurrentPlayerTurnId();
  console.log(
    `requirePlayerTurn: currentPlayerTurnId=${currentPlayerTurnId}, socket.id=${socket.id}, gameMasterId=${game.getGameMaster()?.id}`,
  );
  if (
    currentPlayerTurnId !== socket.id &&
    game.getGameMaster()?.id !== socket.id
  ) {
    return false;
  }
  return true;
}
