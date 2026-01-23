import { AbilityType } from "../../enums/AbilityType";
import { EffectType } from "../../enums/EffectType";
import { StatType } from "../../enums/StatType";
import { Unit } from "../Units/Unit";
import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { MonsterCategory } from "../../enums/Categories/MonsterCategory";

class EffectService {
    /**
     * Calculate the total additive modifier for a stat from STAT_MODIFIER effects
     */
    static getStatModifier(
        unit: Unit<HeroCategory | MonsterCategory>,
        stat: StatType,
    ): number {
        const activeEffects = unit.effects;

        return activeEffects
            .filter(e =>
                (e.effectType === EffectType.STAT_MODIFIER || e.effectType === EffectType.CONDITIONAL_BUFF) &&
                e.stat === stat
            )
            .reduce((sum, e) => sum + (e.value ?? 0), 0);
    }

    /**
     * Calculate the total multiplier for a stat from STAT_MULTIPLIER effects
     * Multipliers stack multiplicatively (2x * 2x = 4x)
     */
    static getStatMultiplier(
        unit: Unit<HeroCategory | MonsterCategory>,
        stat: StatType,
    ): number {
        const activeEffects = unit.effects;

        return activeEffects
            .filter(e => e.effectType === EffectType.STAT_MULTIPLIER && e.stat === stat)
            .reduce((mult, e) => mult * (e.value ?? 1), 1);
    }

    /**
     * Check if unit has a specific ability granted by effects
     */
    static hasAbility(
        unit: Unit<HeroCategory | MonsterCategory>,
        ability: AbilityType
    ): boolean {
        const activeEffects = unit.effects;

        return activeEffects.some(
            e => e.effectType === EffectType.ABILITY_GRANT && e.ability === ability
        );
    }

    /**
     * Get all granted abilities for a unit
     */
    static getGrantedAbilities(
        unit: Unit<HeroCategory | MonsterCategory>
    ): AbilityType[] {
        const activeEffects = unit.effects;

        return activeEffects
            .filter(e => e.effectType === EffectType.ABILITY_GRANT && e.ability !== undefined)
            .map(e => e.ability!);
    }

    /**
     * Check if unit can phase through walls
     */
    static canPhaseThroughWalls(
        unit: Unit<HeroCategory | MonsterCategory>,
    ): boolean {
        return this.hasAbility(unit, AbilityType.PHASE_THROUGH_WALLS);
    }

    /**
     * Check if unit can phase through monsters
     */
    static canPhaseThroughMonsters(
        unit: Unit<HeroCategory | MonsterCategory>
    ): boolean {
        return this.hasAbility(unit, AbilityType.PHASE_THROUGH_MONSTERS);
    }
}

export { EffectService };
