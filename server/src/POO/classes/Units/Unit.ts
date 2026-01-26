import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { MonsterCategory } from "../../enums/Categories/MonsterCategory";
import { FightDiceFaces } from "../../enums/Dices/FightDiceFaces";
import { SpellElement } from "../../enums/SpellElement";
import { AbilityType } from "../../enums/AbilityType";
import { Effect } from "../Effects/Effects";
import { EffectService } from "../../../services/EffectService";
import { Spell } from "../Spell/Spell";
import { Stats } from "./Stats";
import { randomUUID } from "crypto";

abstract class Unit<T extends HeroCategory | MonsterCategory> {
    id: string;
    controlledByPlayerId: string;
    name: string;
    category!: T;
    stats!: Stats;
    effects: Effect[] = [];

    abstract DefenseDiceType: FightDiceFaces; // the dice value that is needed to block damages

    constructor(controlledByPlayerId: string, name: string, category: T, stats: Stats) {
        this.id = randomUUID();
        this.controlledByPlayerId = controlledByPlayerId;
        this.name = name;
        this.category = category;
        this.stats = stats;
    }

    abstract getDefenseDiceCount(): number;

    abstract getAttackDiceCount(): number;

    abstract getMovementPoints(): number;

    getCategory(): string {
        return typeof this.category;
    }

    // -- effects
    addEffect(effect: Effect): void {
        this.effects.push(effect);
    }

    removeEffect(effect: Effect): void {
        this.effects = this.effects.filter(e => e !== effect);
    }

    removeEffectByName(effectName: string): void {
        this.effects = this.effects.filter(e => e.name !== effectName);
    }

    clearEffects(): void {
        this.effects = [];
    }

    // -- ability checks (delegated to EffectService)
    hasAbility(ability: AbilityType): boolean {
        return EffectService.hasAbility(this, ability);
    }

    canPhaseThroughWalls(): boolean {
        return EffectService.canPhaseThroughWalls(this);
    }

    canPhaseThroughMonsters(): boolean {
        return EffectService.canPhaseThroughMonsters(this);
    }

    
}

export { Unit };