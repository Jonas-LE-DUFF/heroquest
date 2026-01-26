import { Game } from "../POO/classes/Server/Game";
import { Player } from "../POO/classes/Server/Player";
import { ServerHeroQuest } from "../server/ServerHeroQuest";

// services/GameService.ts
export class GameService {

    static createGame(gameName: string, player: Player): Game {
        const serverHeroQuest = ServerHeroQuest.getServerInstance();
        const newGame = serverHeroQuest.createGame(gameName);
        newGame.addPlayer(player);

        console.log(
            `New game created with ID : ${newGame.id} and name: ${gameName}`,
        );

        return newGame;
    }

    static getGame(gameId: string): Game | null {
        const serverHeroQuest = ServerHeroQuest.getServerInstance();
        return serverHeroQuest.getGame(gameId);
    }

    static hasGame(gameName: string): boolean {
        const serverHeroQuest = ServerHeroQuest.getServerInstance();
        return serverHeroQuest.getGameByName(gameName) !== null;
    }
    
    static removePlayerFromAllGames(playerId: string): Game[] {
        const serverHeroQuest = ServerHeroQuest.getServerInstance();
        return serverHeroQuest.removePlayerFromAllGames(playerId);
    }

    static removeGame(gameId: string): void {
        const serverHeroQuest = ServerHeroQuest.getServerInstance();
        serverHeroQuest.removeGame(gameId);
    }
}
