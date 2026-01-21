import { HeroCategory } from "../Categories/HeroCategory";
import { MonsterCategory } from "../Categories/MonsterCategory";
import { Effect } from "../Effects/Effects";
import { Position } from "../Position/Position";
import { Stats } from "./Stats";

abstract class Unit<T extends HeroCategory | MonsterCategory> {
    id: string;
    name: string;
    category!: T;
    position: Position;
    stats!: Stats;
    effects: Effect[] = [];

    abstract DefenseDiceType: string; // the dice value that is needed to block damages


    constructor(id: string, name: string, category: T, position: Position, stats: Stats) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.position = position;
        this.stats = stats;
    }

    abstract getDefenseDiceCount(): number;

    abstract getAttackDiceCount(): number;

    getCategory(): T {
        return this.category;
    }


}

export { Unit };