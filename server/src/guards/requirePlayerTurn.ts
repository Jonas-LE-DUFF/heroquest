import { Socket } from "socket.io";
import { Game } from "../POO/classes/Server/Game";

export function requirePlayerTurn(socket: Socket, game: Game): boolean {
    if (
        game.getCurrentPlayerTurnId() !== socket.id &&
        game.getGameMaster()?.id !== socket.id
    ) {
        return false;
    }
    return true;
}
