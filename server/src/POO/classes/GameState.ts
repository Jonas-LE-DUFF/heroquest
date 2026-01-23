import { HeroCategory } from "../enums/Categories/HeroCategory";
import { MonsterCategory } from "../enums/Categories/MonsterCategory";
import { Board } from "./Board/Board";
import { Unit } from "./Units/Unit";

class GameState {
    Units: Unit<HeroCategory | MonsterCategory>[];
    Board: Board
    status: "lobby" | "playing" | "finished";

    constructor() {
        this.Units = [];
        this.Board = new Board();
        this.status = "lobby";
    }

    addMonster(unit: Unit<MonsterCategory>): void {
        this.Units.push(unit);
    }

    addPlayer(unit: Unit<HeroCategory>): void {
        this.Units.push(unit);
    }

    removeUnit(unit: Unit<HeroCategory | MonsterCategory>): void {
        this.Units = this.Units.filter(u => u !== unit);
    }

    getUnitById(id: string): Unit<HeroCategory | MonsterCategory> | undefined {
        return this.Units.find(u => u.id === id);
    }
}

export { GameState };