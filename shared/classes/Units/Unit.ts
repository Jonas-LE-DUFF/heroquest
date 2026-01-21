import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { MonsterCategory } from "../../enums/Categories/MonsterCategory";
import { FightDiceFaces } from "../../enums/Dices/FightDiceFaces";
import { Effect } from "../Effects/Effects";
import { Position } from "../Position/Position";
import { Spell } from "../Spell/Spell";
import { Stats } from "./Stats";

abstract class Unit<T extends HeroCategory | MonsterCategory> {
    id: string;
    name: string;
    category!: T;
    position: Position;
    stats!: Stats;
    effects: Effect[] = [];
    spells: Spell[] = [];

    abstract DefenseDiceType: FightDiceFaces; // the dice value that is needed to block damages

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