import { Socket } from "socket.io";
import { Game } from "../POO/classes/Server/Game";

export function requireGameMaster(
    socket: Socket, 
    game: Game
): boolean {
    const player = game.players.get(socket.id);
    if (player?.role !== "game-master") {
        socket.emit("error", "Only game master can do this");
        return false;
    }
    return true;
}