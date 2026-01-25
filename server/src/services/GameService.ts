import { Game } from "../POO/classes/Server/Game";
import { Player } from "../POO/classes/Server/Player";

// services/GameService.ts
export class GameService {
    private games = new Map<string, Game>();

    createGame(gameName: string, player: Player): Game {
        const newGame = new Game(gameName);
        this.games.set(newGame.id, newGame);
        newGame.addPlayer(player);

        console.log(
            `New game created with ID : ${newGame.id} and name: ${gameName}`,
        );

        return newGame;
    }

    getGame(gameId: string): Game | undefined {
        return this.games.get(gameId);
    }

    getGameByName(gameName: string): Game | undefined {
        for (const game of this.games.values()) {
            if (game.name === gameName) {
                return game;
            }
        }
        return undefined;
    }

    hasGame(gameName: string): boolean {
        this.games.forEach((game) => {
            if (game.name === gameName) {
                return true;
            }
        });
        return false;
    }
    
    removePlayerFromAllGames(playerId: string): Game[] {
        const modifiedGames: Game[] = [];
        this.games.forEach((game) => {
            if (game.players.has(playerId)) {
                game.removePlayer(playerId);
                modifiedGames.push(game);
            }
        });
        return modifiedGames;
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
