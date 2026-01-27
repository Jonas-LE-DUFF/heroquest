import { Socket } from "socket.io";
import { Game } from "../POO/classes/Server/Game";

export function requirePlayerTurn(socket: Socket, game: Game): boolean {
    if (
        game.getCurrentPlayerTurnId() !== socket.data.playerId &&
        game.getGameMaster()?.id !== socket.data.playerId
    ) {
        return false;
    }
    return true;
}
