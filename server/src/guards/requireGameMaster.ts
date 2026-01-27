import { Socket } from "socket.io";
import { Game } from "../POO/classes/Server/Game";

export function requireGameMaster(socket: Socket, game: Game): boolean {
    const player = game.getPlayer(socket.data.playerId);
    if (player?.role !== "game-master") {
        console.error("error : Only the game-master can make this action");
        return false;
    }
    return true;
}
