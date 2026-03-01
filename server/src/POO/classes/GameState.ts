import { HeroCategory } from "../enums/Categories/HeroCategory";
import { MonsterCategory } from "../enums/Categories/MonsterCategory";
import { GameStateAsJson } from "../interfaces/ClassAsJson/Server/GameStateAsJson";
import { StatsAsJson } from "../interfaces/ClassAsJson/Unit/StatsAsJson";
import { SpecialAuthorizedHero } from "../interfaces/SpecialAuthorizedHero";
import { Board } from "./Board/Board";
import { Position } from "./Position/Position";
import { Spell } from "./Spell/Spell";
import { Hero } from "./Units/Hero";
import { Monster } from "./Units/Monster";
import { Stats } from "./Units/Stats";
import { Unit } from "./Units/Unit";

class GameState {
  Units: Unit<HeroCategory | MonsterCategory>[];
  board: Board;
  status: "lobby" | "playing" | "finished";

  private specialAuthorizedHero: SpecialAuthorizedHero | undefined = undefined;

  constructor() {
    this.Units = [];
    this.board = new Board();
    this.status = "lobby";
  }

  addUnit(unit: Unit<HeroCategory | MonsterCategory>): void {
    this.Units.push(unit);
  }

  /**
   * removes unit from the game state and from the board
   * if the unit is not found, does nothing
   * @param unit the unit to remove
   */
  removeUnit(unit: Unit<HeroCategory | MonsterCategory>): void {
    this.Units = this.Units.filter((u) => u !== unit);
    this.board.removeUnitFromTile(unit);
  }

  removeUnitsControlledByPlayer(playerId: string) {
    const unitsToRemove = this.getHeroesControlledByPlayer(playerId);
    unitsToRemove.forEach((unit) => {
      this.removeUnit(unit);
    });
  }

  /**
   * clears tile at position from the board and removes the unit from the game state if found
   * @param position the position of the tile to clear
   */
  clearTileAtPosition(position: Position): void {
    const unit = this.board.clearTileAtPosition(position);
    if (unit) {
      this.Units = this.Units.filter((u) => u !== unit);
    }
  }

  getUnitById(id: string): Unit<HeroCategory | MonsterCategory> | undefined {
    return this.Units.find((u) => u.id === id);
  }

  getUnitByPosition(
    position: Position,
  ): Unit<HeroCategory | MonsterCategory> | undefined {
    return this.board.getUnitAt(position);
  }

  getHeroById(id: string): Hero | undefined {
    return this.Units.find((u) => u.id === id && u instanceof Hero) as
      | Hero
      | undefined;
  }

  getMonsterById(id: string): Monster | undefined {
    return this.Units.find((u) => u.id === id && u instanceof Monster) as
      | Monster
      | undefined;
  }

  getHeroByCategory(category: HeroCategory): Hero {
    const hero = this.Units.find((u) => u.category === category) as
      | Hero
      | undefined;
    if (!hero) {
      console.error("Hero not found for category:", category);
      throw new Error("Hero not found");
    }
    return hero;
  }

  isLaunchable(): { success: boolean; error?: string } {
    const heroes = this.Units.filter((u) => u instanceof Hero);
    if (heroes.length < 1) {
      return {
        success: false,
        error: "At least one hero is required to start the game.",
      };
    }
    if (heroes.length > 4) {
      return {
        success: false,
        error: "No more than four heroes are allowed to start the game.",
      };
    }
    if (this.status !== "lobby") {
      return {
        success: false,
        error: "Game is not in a launchable state.",
      };
    }
    return { success: true };
  }

  isHeroCategoryTaken(category: HeroCategory): boolean {
    return this.Units.some((u) => u instanceof Hero && u.category === category);
  }

  getSpellsTaken(spells: Spell[]): Spell[] {
    const heroes = this.Units.filter((u) => u instanceof Hero) as Hero[];
    const spellsTaken = [];
    for (const spell of spells) {
      for (const hero of heroes) {
        if (hero.spells.includes(spell)) {
          spellsTaken.push(spell);
        }
      }
    }
    return spellsTaken;
  }

  getHeroesControlledByPlayer(playerId: string): Hero[] {
    return this.Units.filter(
      (u) => u instanceof Hero && u.controlledByPlayerId === playerId,
    ) as Hero[];
  }

  getSpecialAuthorizedHero(): SpecialAuthorizedHero | undefined {
    return this.specialAuthorizedHero;
  }

  setSpecialAuthorizedHero(
    specialAuthorizedHero: SpecialAuthorizedHero | undefined,
  ): void {
    this.specialAuthorizedHero = specialAuthorizedHero;
  }

  getAttackDicesForHero(category: HeroCategory): number {
    const hero = this.getHeroByCategory(category);
    return hero.getAttackDiceCount();
  }

  getMonsters(): Monster[] {
    return this.Units.filter((u) => u instanceof Monster) as Monster[];
  }

  updateUnitStats(newStats: StatsAsJson, position: Position): void {
    const unit = this.getUnitByPosition(position);
    const statsClass: Stats = {
      movements: newStats.movements,
      health: newStats.health,
      maxHealth: newStats.maxHealth,
      spirit: newStats.spirit,
      nbDefenseDice: newStats.defense,
    };

    if (unit?.stats) {
      unit.stats = statsClass;
    } else {
      console.error("Unit to update not found or mismatch in ID/category");
      throw new Error("Unit to update not found or mismatch in ID/category");
    }
  }

  toJson(): GameStateAsJson {
    return {
      Units: this.Units.map((unit) => unit.toJson()),
      board: this.board.toJson(),
      status: this.status,
    };
  }
}

export { GameState };
