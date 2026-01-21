import { MonsterCategory } from "../../enums/Categories/MonsterCategory";
import { FightDiceFaces } from "../../enums/Dices/FightDiceFaces";
import { Position } from "../Position/Position";
import { Stats } from "./Stats";
import { Unit } from "./Unit";

class Monster extends Unit<MonsterCategory> {
    DefenseDiceType = FightDiceFaces.BlackShield;

    nbAttackDice: number;

    constructor(id: string, name: string, category: MonsterCategory, position: Position, stats: Stats, nbAttackDice: number) {
        super(id, name, category, position, stats);
        this.nbAttackDice = nbAttackDice;
    }

    getDefenseDiceCount(): number {
        return this.stats.nbDefenseDice;
    }

    getAttackDiceCount(): number {
        return this.nbAttackDice;
    }
}

export { Monster };