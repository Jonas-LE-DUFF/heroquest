import { randomUUID } from "crypto";
import { GameState } from "../GameState";
import { Player } from "./Player";
import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { Hero } from "../Units/Hero";

class Game {
    id: string;
    name: string;
    players: Map<string, Player>; // playerId -> Player

    playOrder: HeroCategory[] = [];
    isMonsterTurn: boolean = false;
    currentTurnIndex: number = 0;

    gameState: GameState;

    constructor(name: string) {
        this.id = randomUUID();
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
        if (this.players.size === 4 && player.role !== "game-master" && this.getGameMaster() === null) {
            throw new Error("Cannot add more than 4 hero players to the game.");
        }
        
        this.players.set(player.id, player);
    }

    removePlayer(playerId: string): void {
        this.players.delete(playerId);
    }

    launchGame(): void {
        if( this.players.size < 1) {
            throw new Error("Not enough players to start the game.");
        }
        if( this.players.size > 5) {
            throw new Error("Too many players to start the game.");
        }
        if (![...this.players.values()].some(player => player.role === "game-master")) {
            throw new Error("A game master is required to start the game.");
        }
        const callback = this.gameState.isLaunchable();
        if (!callback.success) {
            throw new Error(`Game State is not launchable: ${callback.message}`);
        }

        this.createTurnOrder();

        this.currentTurnIndex = 0;
        this.isMonsterTurn = true;

        this.gameState.status = "playing";
    }

    getCurrentPlayerTurnId(): string {
        if (this.isMonsterTurn) {
            return this.getGameMaster()!.id;
        }
        const currentPlayerId = this.playOrder[this.currentTurnIndex];
        if (!currentPlayerId) {
            throw new Error("No current player turn found.");
        }  
        return this.gameState.getHeroByCategory(currentPlayerId).id;
    }

    getCurrentPlayerTurn(): Player {
        if (this.isMonsterTurn) {
            const gm = this.getGameMaster();
            if (!gm) {
                throw new Error("It's currently the monsters' turn, but no game master found.");
            }
            return gm;
        }
        const player = this.players.get(this.getCurrentPlayerTurnId());
        if (!player) {
            throw new Error("Current player not found.");
        }
        return player;
    }

    getCurrentHeroTurn(): Hero {
        if (this.isMonsterTurn) {
            throw new Error("It's currently the monsters' turn.");
        }
        const currentHeroCategory = this.playOrder[this.currentTurnIndex];
        if (!currentHeroCategory) {
            throw new Error("No current hero turn found.");
        }
        return this.gameState.getHeroByCategory(currentHeroCategory);
    }

    getGameMaster(): Player | null {
        for (const player of this.players.values()) {
            if (player.role === "game-master") {
                return player;
            }
        }
        return null;
    }

    getGameState(): GameState {
        return this.gameState;
    }

    endTurn(): void {
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.playOrder.length;
    }

    private createTurnOrder(): void {
        this.playOrder = [];
        for (const player of this.players.values()) {
            if (player.role !== "game-master") {
                const heroCategory : HeroCategory = this.gameState.Units.find(unit => unit instanceof Hero && unit.controlledByPlayerId === player.id)?.category as HeroCategory;
                if (heroCategory !== undefined && !this.playOrder.includes(heroCategory)) {
                    this.playOrder.push(heroCategory);
                }
            }
        }   
    }

    
}

export { Game };