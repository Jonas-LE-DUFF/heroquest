import { HeroCategory } from "../enums/Categories/HeroCategory";
import { MonsterCategory } from "../enums/Categories/MonsterCategory";
import { Board } from "./Board/Board";
import { Unit } from "./Units/Unit";

class GameState {
    Units: Unit<HeroCategory | MonsterCategory>[];
    Board: Board
    playOrder: Unit<HeroCategory>[];
    currentTurnIndex?: number;
    status: "lobby" | "playing" | "finished";

    constructor() {
        this.Units = [];
        this.Board = new Board();
        this.playOrder = [];
        this.status = "lobby";
    }

    addMonster(unit: Unit<MonsterCategory>): void {
        this.Units.push(unit);
    }

    addPlayer(unit: Unit<HeroCategory>): void {
        this.Units.push(unit);
        this.playOrder.push(unit);
        // TODO : set game master as first player if not set
        

    }

    removeUnit(unit: Unit<HeroCategory | MonsterCategory>): void {
        this.Units = this.Units.filter(u => u !== unit);
    }

    getUnitById(id: string): Unit<HeroCategory | MonsterCategory> | undefined {
        return this.Units.find(u => u.id === id);
    }

    endTurn(): void {
        if (this.currentTurnIndex === undefined) {
            this.currentTurnIndex = 0;
        } else {
            this.currentTurnIndex = (this.currentTurnIndex + 1) % this.playOrder.length;
        }
    }

    
}

export { GameState };