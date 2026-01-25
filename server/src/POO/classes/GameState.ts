import { HeroCategory } from "../enums/Categories/HeroCategory";
import { MonsterCategory } from "../enums/Categories/MonsterCategory";
import { Board } from "./Board/Board";
import { Hero } from "./Units/Hero";
import { Monster } from "./Units/Monster";
import { Unit } from "./Units/Unit";

class GameState {
    Units: Unit<HeroCategory | MonsterCategory>[];
    board: Board
    status: "lobby" | "playing" | "finished";

    constructor() {
        this.Units = [];
        this.board = new Board();
        this.status = "lobby";
    }

    addMonster(unit: Unit<MonsterCategory>): void {
        this.Units.push(unit);
    }

    addHero(unit: Unit<HeroCategory>): void {
        this.Units.push(unit);
    }

    removeUnit(unit: Unit<HeroCategory | MonsterCategory>): void {
        this.Units = this.Units.filter(u => u !== unit);
    }

    getUnitById(id: string): Unit<HeroCategory | MonsterCategory> | undefined {
        return this.Units.find(u => u.id === id);
    }

    getHeroById(id: string): Hero | undefined {
        return this.Units.find(u => u.id === id && u instanceof Hero) as Hero | undefined;
    }

    getMonsterById(id: string): Monster | undefined {
        return this.Units.find(u => u.id === id && u instanceof Monster) as Monster | undefined;
    }

    getHeroByCategory(category: HeroCategory): Hero{
        const hero = this.Units.find(u => u.category === category) as Hero | undefined;
        if (!hero) {
            console.error("Hero not found for category:", category);
            throw new Error("Hero not found");
        }
        return hero;
    }

    isLaunchable(): { success: boolean; message?: string } {
        const heroes = this.Units.filter(u => u instanceof Hero);
        if (heroes.length < 1) {
            return { success: false, message: "At least one hero is required to start the game." };
        }
        if (heroes.length > 4) {
            return { success: false, message: "No more than four heroes are allowed to start the game." };
        }
        if (this.status !== "lobby") {
            return { success: false, message: "Game is not in a launchable state." };
        }
        return { success: true };
    }
}

export { GameState };