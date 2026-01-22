import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { MonsterCategory } from "../../enums/Categories/MonsterCategory";
import { FightDiceFaces } from "../../enums/Dices/FightDiceFaces";
import { SpellElement } from "../../enums/SpellElement";
import { AbilityType } from "../../enums/AbilityType";
import { Effect } from "../Effects/Effects";
import { EffectService } from "../Effects/EffectService";
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
    usedSpells: Spell[] = [];

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

    abstract getMovementPoints(): number;

    getCategory(): T {
        return this.category;
    }

    moveTo(newPosition: Position): void {
        this.position = newPosition;
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

    // -- spells
    setSpells(spells: Spell[]): void {
        this.spells = spells;
    }

    useSpell(spell: Spell): void {
        this.usedSpells.push(spell);
    }

    unuseSpell(spell: Spell): void {
        this.usedSpells = this.usedSpells.filter(s => s !== spell);
    }

    getSpellsByElement(element: SpellElement): Spell[] {
        return this.spells.filter(spell => spell.element === element);
    }
}

export { Unit };