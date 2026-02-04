import { randomUUID } from "crypto";
import { GameState } from "../GameState";
import { Player } from "./Player";
import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { Hero } from "../Units/Hero";
import { Monster } from "../Units/Monster";
import { GameAsJson } from "../../interfaces/ClassAsJson/Server/GameAsJson";

class Game {
    id: string;
    name: string;
    private players: Map<string, Player>; // playerId -> Player

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

    /**
     * Add a player to the game
     * @throws Error if the player cannot be added
     * @param player the player you want to add to the game
     */
    addPlayer(player: Player): void {
        if (this.players.has(player.id)) {
            throw new Error(
                `Player with id ${player.id} already exists in the game.`,
            );
        }
        if (this.players.size >= 5) {
            throw new Error("Cannot add more than 5 players to the game.");
        }
        if (player.role === "game-master") {
            for (const p of this.players.values()) {
                if (p.role === "game-master") {
                    throw new Error(
                        "A game master already exists in the game.",
                    );
                }
            }
        }
        if (
            this.players.size === 4 &&
            player.role !== "game-master" &&
            this.getGameMaster() === null
        ) {
            throw new Error("Cannot add more than 4 hero players to the game.");
        }

        this.players.set(player.id, player);
    }

    removePlayer(playerId: string): void {
        this.players.delete(playerId);
    }

    getPlayer(playerId: string): Player | undefined {
        return this.players.get(playerId);
    }

    hasPlayer(playerId: string): boolean {
        return this.players.has(playerId);
    }

    getAmountOfPlayers(): number {
        return this.players.size;
    }

    /**
     * Launch the game if all conditions are met
     * @throws Error if the game cannot be launched
     */
    launchGame(): void {
        if (this.players.size < 1) {
            throw new Error("Not enough players to start the game.");
        }
        if (this.players.size > 5) {
            throw new Error("Too many players to start the game.");
        }
        if (
            ![...this.players.values()].some(
                (player) => player.role === "game-master",
            )
        ) {
            throw new Error("A game master is required to start the game.");
        }
        const callback = this.gameState.isLaunchable();
        if (!callback.success) {
            throw new Error(
                `Game State is not launchable: ${callback.message}`,
            );
        }

        this.createTurnOrder();

        this.currentTurnIndex = 0;
        this.isMonsterTurn = true;

        this.gameState.status = "playing";
    }

    /**
     * this functions fetches the playerId of the player whose turn it is currently
     * @throws Error if no current player turn found
     * @returns the playerId to play the current turn
     */
    getCurrentPlayerTurnId(): string {
        if (this.isMonsterTurn) {
            return this.getGameMaster()!.id;
        }
        const currentPlayerId = this.playOrder[this.currentTurnIndex];
        if (!currentPlayerId) {
            throw new Error("No current player turn found.");
        }
        return this.gameState.getHeroByCategory(currentPlayerId)
            .controlledByPlayerId;
    }

    /**
     * @throws Error if no current player found
     * @returns the player who controlls the hero whose turn it is currently
     */
    getCurrentPlayerTurn(): Player {
        const player = this.players.get(this.getCurrentPlayerTurnId());
        if (!player) {
            throw new Error("Current player not found.");
        }
        return player;
    }

    /**
     * @throws Error if no current hero turn found or if it's monster turn
     * @returns the Hero whose turn it is currently
     */
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
        try {
            const heroTurn = this.getCurrentHeroTurn();
            heroTurn.endTurnEffects();
            this.currentTurnIndex =
                (this.currentTurnIndex + 1) % this.playOrder.length;
        } catch {
            // it's monster turn
            this.isMonsterTurn = false;
            this.currentTurnIndex = 0;
            this.gameState.getMonsters().forEach((monster : Monster) => {
                monster.endTurnEffects();
            });
            return;
        }
    }

    private createTurnOrder(): void {
        this.playOrder = [];
        for (const player of this.players.values()) {
            if (player.role !== "game-master") {
                const heroCategory: HeroCategory = this.gameState.Units.find(
                    (unit) =>
                        unit instanceof Hero &&
                        unit.controlledByPlayerId === player.id,
                )?.category as HeroCategory;
                if (
                    heroCategory !== undefined &&
                    !this.playOrder.includes(heroCategory)
                ) {
                    this.playOrder.push(heroCategory);
                }
            }
        }
    }

    toJson(): GameAsJson{
        const playersAsJson = Array.from(this.players.values()).map((player) => player.toJson());
        const isLaunchable = this.gameState.isLaunchable();
        return {
            id: this.id,
            name: this.name,
            players: playersAsJson,
            gameState: this.gameState.toJson(),
            playOrder: this.playOrder,
            isMonsterTurn: this.isMonsterTurn,
            currentTurnIndex: this.currentTurnIndex,
            isLaunchable: {
                success: isLaunchable.success,
                reasons: isLaunchable.success ? [] : [isLaunchable.message || "Unknown reason"]
            },
        };
    }
}

export { Game };
