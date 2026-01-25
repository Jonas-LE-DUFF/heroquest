import { AbilityType } from "../../enums/AbilityType";
import { EffectDuration } from "../../enums/Effects/EffectDuration";
import { EffectType } from "../../enums/Effects/EffectType";
import { StatType } from "../../enums/Effects/StatType";

class Effect {
    name: string;
    effectType: EffectType;
    duration: EffectDuration;

    // For STAT_MODIFIER and STAT_MULTIPLIER
    stat?: StatType | undefined;
    value?: number | undefined;

    // For ABILITY_GRANT
    ability?: AbilityType | undefined;

    constructor(
        name: string,
        effectType: EffectType,
        duration: EffectDuration,
        options?: {
            stat?: StatType;
            value?: number;
            ability?: AbilityType;
        },
    ) {
        this.name = name;
        this.effectType = effectType;
        this.duration = duration;

        if (options) {
            this.stat = options.stat;
            this.value = options.value;
            this.ability = options.ability;
        }
    }
}

// Pre-defined effects factory
class EffectFactory {
    static createCourage(): Effect {
        return new Effect(
            "Courage",
            EffectType.CONDITIONAL_BUFF,
            EffectDuration.UNTIL_CONDITION,
            {
                stat: StatType.ATTACK,
                value: 2,
            },
        );
    }

    static createPhaseThroughWalls(): Effect {
        return new Effect(
            "Phase Through Walls",
            EffectType.ABILITY_GRANT,
            EffectDuration.ONE_TURN,
            {
                ability: AbilityType.PHASE_THROUGH_WALLS,
            },
        );
    }

    static createPhaseThroughMonsters(): Effect {
        return new Effect(
            "Phase Through Monsters",
            EffectType.ABILITY_GRANT,
            EffectDuration.ONE_TURN,
            {
                ability: AbilityType.PHASE_THROUGH_MONSTERS,
            },
        );
    }

    static createSwift(): Effect {
        return new Effect(
            "Swift",
            EffectType.STAT_MULTIPLIER,
            EffectDuration.ONE_TURN,
            {
                stat: StatType.MOVEMENT,
                value: 2,
            },
        );
    }

    static createStatModifier(
        name: string,
        stat: StatType,
        value: number,
        duration: EffectDuration = EffectDuration.ONE_TURN,
    ): Effect {
        return new Effect(name, EffectType.STAT_MODIFIER, duration, {
            stat,
            value,
        });
    }
}

export { Effect, EffectFactory };
