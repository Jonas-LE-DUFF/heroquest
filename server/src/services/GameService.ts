import { Game } from "../POO/classes/Server/Game";
import { Player } from "../POO/classes/Server/Player";

// services/GameService.ts
export class GameService {
    private games = new Map<string, Game>();

    createGame(gameId: string, gameName: string, player: Player): Game { 
        const newGame = new Game(gameId, gameName);
        this.games.set(gameId, newGame);
        newGame.addPlayer(player);
        return newGame;
    }
    getGame(gameId: string): Game | undefined { 
        return this.games.get(gameId);
    }
    removeGame(gameId: string): void {
        this.games.delete(gameId);
    }
    
    startGame(game: Game): void {
        game.launchGame();
        // ... place heroes, set first turn, etc.
    }
    
    endTurn(game: Game): void {
        // ... handle status effects, get next player
        game.endTurn();
    }
}