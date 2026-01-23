import { Socket } from "socket.io";
import { Game } from "../POO/classes/Server/Game";

export function requirePlayerTurn(
    socket: Socket, 
    game: Game
): boolean {
    if (game.getCurrentPlayerTurn().id !== socket.id) {
        socket.emit("error", "Ce n'est pas votre tour");
        return false;
    }
    return true;
}