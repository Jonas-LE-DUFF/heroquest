import { Game } from "./Game";

class Server {
    games: Map<string, Game>; // gameId -> Game


    constructor() {
        this.games = new Map<string, Game>();
    }

    createGame(id: string, name: string): Game {
        if (this.games.has(id)) {
            throw new Error(`Game with id ${id} already exists.`);
        }
        const newGame = new Game(id, name);
        this.games.set(id, newGame);
        return newGame;
    }

    getGame(id: string): Game | null {
        return this.games.get(id) || null;
    }

    removeGame(id: string): void {
        this.games.delete(id);
    }
}