
import { GameState } from "../GameState";
import { Player } from "./Player";

class Game {
    id: string;
    name: string;
    players: Map<string, Player>; // playerId -> Player
    gameState: GameState;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.players = new Map<string, Player>();
        this.gameState = new GameState();
    }

    addPlayer(player: Player): void {
        if (this.players.has(player.id)) {
            throw new Error(`Player with id ${player.id} already exists in the game.`);
        }
        if (this.players.size >= 5) {
            throw new Error("Cannot add more than 5 players to the game.");
        }
        if (player.role === "game-master") {
            for (const p of this.players.values()) {
                if (p.role === "game-master") {
                    throw new Error("A game master already exists in the game.");
                }
            }
        }
        this.players.set(player.id, player);
    }

    removePlayer(playerId: string): void {
        this.players.delete(playerId);
    }

    launchGame(): void {
        if (this.gameState.status !== "lobby") {
            throw new Error("Game has already started or finished.");
        }
        if( this.players.size < 1) {
            throw new Error("Not enough players to start the game.");
        }
        if( this.players.size > 5) {
            throw new Error("Too many players to start the game.");
        }
        if (![...this.players.values()].some(player => player.role === "game-master")) {
            throw new Error("A game master is required to start the game.");
        }

        this.gameState.status = "playing";
    }

    
}

export { Game };