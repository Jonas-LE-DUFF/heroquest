import { randomUUID } from "crypto";
import { GameState } from "../GameState";
import { Player } from "./Player";
import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { Hero } from "../Units/Hero";
import { Monster } from "../Units/Monster";
import { GameAsJson } from "../../interfaces/ClassAsJson/Server/GameAsJson";
import { PlayerRole } from "../../enums/PlayerRole";
import { Position } from "../Position/Position";
import { Direction } from "../../enums/Direction";
import { get } from "http";

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
    if (this.gameState.status !== "lobby") {
      throw new Error("Cannot join a game that has already started.");
    }
    if (this.players.has(player.id)) {
      throw new Error(
        `Player with id ${player.id} already exists in the game.`,
      );
    }
    if (this.players.size >= 5) {
      throw new Error("Cannot add more than 5 players to the game.");
    }
    if (player.role === PlayerRole.GAME_MASTER) {
      for (const p of this.players.values()) {
        if (p.role === PlayerRole.GAME_MASTER) {
          throw new Error("A game master already exists in the game.");
        }
      }
    }

    // at least one game master is required, checking for the last player added to the game
    if (this.players.size === 4 && player.role !== PlayerRole.GAME_MASTER) {
      try {
        this.getGameMaster();
      } catch {
        throw new Error("Cannot add more than 4 hero players to the game.");
      }
    }

    this.players.set(player.id, player);
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
    this.gameState.removeUnitsControlledByPlayer(playerId);
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
        (player) => player.role === PlayerRole.GAME_MASTER,
      )
    ) {
      throw new Error("A game master is required to start the game.");
    }
    const callback = this.gameState.isLaunchable();
    if (!callback.success) {
      throw new Error(`Game State is not launchable: ${callback.error}`);
    }

    const allSpells = this.gameState.Units.filter(
      (unit) => unit instanceof Hero,
    ).flatMap((hero) => (hero as Hero).getSpellElements());
    const uniqueSpells = new Set(allSpells);
    if (allSpells.length !== uniqueSpells.size) {
      throw new Error(
        "The same spell element cannot be chosen for different heroes.",
      );
    }

    this.createTurnOrder();

    this.currentTurnIndex = 0;
    this.isMonsterTurn = true;
    this.placeHeroesAtStart();
    this.gameState.status = "playing";
  }

  private placeHeroesAtStart(): void {
    const startingPosition: Position | null =
      this.gameState.board.getSpawnPointPosition();
    if (!startingPosition) {
      throw new Error("No spawn point found on the board.");
    }
    const heroes = this.getHeroes();
    const positions: Position[] = [
      startingPosition,
      startingPosition.afterMove(Direction.RIGHT),
      startingPosition.afterMove(Direction.DOWN),
      startingPosition.afterMove(Direction.DOWN).afterMove(Direction.RIGHT),
    ];
    for (let i = 0; i < heroes.length; i++) {
      const hero = heroes[i];
      const position = positions[i];
      if (
        !position ||
        !position.isValid(
          this.gameState.board.BOARD_WIDTH,
          this.gameState.board.BOARD_HEIGHT,
        )
      ) {
        console.error("Invalid starting position for hero:", position);
        throw new Error("Invalid starting position for hero.");
      }
      if (!hero) {
        console.error(`Hero not found for category: ${this.playOrder[i]}`);
        throw new Error(`Hero not found for category: ${this.playOrder[i]}`);
      }
      this.gameState.board.placeUnitAt(hero, position);
    }
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
    const heroCategoryToPlay = this.playOrder[this.currentTurnIndex];
    if (!heroCategoryToPlay) {
      throw new Error("No current player turn found.");
    }
    return this.gameState.getHeroByCategory(heroCategoryToPlay)
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

  getGameMaster(): Player {
    for (const player of this.players.values()) {
      if (player.role === PlayerRole.GAME_MASTER) {
        return player;
      }
    }
    throw new Error("Game master not found.");
  }

  getHeroes(): Hero[] {
    return this.gameState.Units.filter(
      (unit) => unit instanceof Hero,
    ) as Hero[];
  }

  getGameState(): GameState {
    return this.gameState;
  }

  endTurn(): void {
    if (!this.isMonsterTurn) {
      const heroTurn = this.getCurrentHeroTurn();
      heroTurn.endTurnEffects();
      if (this.currentTurnIndex === this.playOrder.length - 1) {
        this.isMonsterTurn = true;
      }
      this.currentTurnIndex =
        (this.currentTurnIndex + 1) % this.playOrder.length;
    } else {
      // it's monster turn
      this.isMonsterTurn = false;
      this.currentTurnIndex = 0;
      this.gameState.getMonsters().forEach((monster: Monster) => {
        monster.endTurnEffects();
      });
      return;
    }
  }

  private createTurnOrder(): void {
    this.playOrder = [];
    for (const player of this.players.values()) {
      if (player.role !== PlayerRole.GAME_MASTER) {
        const heroCategories: HeroCategory[] = this.gameState.Units.filter(
          (unit) =>
            unit instanceof Hero && unit.controlledByPlayerId === player.id,
        )?.map((hero) => hero.category) as HeroCategory[];
        for (const heroCategory of heroCategories) {
          if (!this.playOrder.includes(heroCategory)) {
            this.playOrder.push(heroCategory);
          }
        }
      }
    }
  }

  updateHeroEquipment(heroId: string, equipment: string[], gold: number): void {
    const hero: Hero | undefined= this.gameState.getHeroById(heroId);
    if (!hero) {
      throw new Error(`Hero with id ${heroId} not found.`);
    }
    hero.updateEquipment(equipment);
    hero.updateGold(gold);
  }

  toJson(): GameAsJson {
    const playersAsJson = Array.from(this.players.values()).map((player) =>
      player.toJson(),
    );
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
        reasons: isLaunchable.success
          ? []
          : [isLaunchable.error || "Unknown reason"],
      },
    };
  }
}

export { Game };
