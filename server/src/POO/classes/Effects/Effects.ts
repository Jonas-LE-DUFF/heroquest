import { AbilityType } from "../../enums/AbilityType";
import { DebuffType } from "../../enums/DebuffType";
import { EffectDuration } from "../../enums/Effects/EffectDuration";
import { EffectType } from "../../enums/Effects/EffectType";
import { StatType } from "../../enums/Effects/StatType";
import { EffectAsJson } from "../../interfaces/ClassAsJson/Effect/EffectAsJson";

class Effect {
  name: string;
  isBuff: boolean;
  effectType: EffectType;
  duration: EffectDuration;

  // For STAT_MODIFIER and STAT_MULTIPLIER
  stat?: StatType | undefined;
  value?: number | undefined;

  // For ABILITY_GRANT
  ability?: AbilityType | undefined;
  debuff?: DebuffType | undefined;

  constructor(
    name: string,
    effectType: EffectType,
    duration: EffectDuration,
    isBuff: boolean,
    options?: {
      stat?: StatType;
      value?: number;
      ability?: AbilityType;
      debuff?: DebuffType;
    },
  ) {
    this.name = name;
    this.effectType = effectType;
    this.duration = duration;
    this.isBuff = isBuff;
    if (options) {
      this.stat = options.stat;
      this.value = options.value;
      this.ability = options.ability;
      this.debuff = options.debuff;
    }
  }

  /**
   * Handle duration tick for the effect
   * @returns true if the effect has expired and should be removed
   */
  durationTick(): boolean {
    if (EffectDuration.ONE_TURN === this.duration) {
      return true;
    }
    return false;
  }

  toJson(): EffectAsJson {
    return {
      name: this.name,
      isBuff: this.isBuff,
      effectType: this.effectType,
      duration: this.duration,
      ability: this.ability,
      debuff: this.debuff,
    };
  }
}

// Pre-defined effects factory
class EffectFactory {
  static createRockSkin(): Effect {
    return new Effect(
      "Rock Skin",
      EffectType.STAT_MODIFIER,
      EffectDuration.UNTIL_DAMAGE_TAKEN,
      true,
      {
        stat: StatType.DEFENSE,
        value: 1,
      },
    );
  }
  static createTornado(): Effect {
    return new Effect(
      "Tornado",
      EffectType.DEBUFF_GRANT,
      EffectDuration.ONE_TURN,
      false,
      {
        debuff: DebuffType.SKIP_TURN,
      },
    );
  }
  static createSleep(): Effect {
    return new Effect(
      "Sleep",
      EffectType.DEBUFF_GRANT,
      EffectDuration.SPIRIT_CHECK,
      false,
      {
        debuff: DebuffType.ASLEEP,
      },
    );
  }
  static createCourage(): Effect {
    return new Effect(
      "Courage",
      EffectType.CONDITIONAL_BUFF,
      EffectDuration.UNTIL_CONDITION,
      true,
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
      true,
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
      true,
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
      true,
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
    return new Effect(name, EffectType.STAT_MODIFIER, duration, value > 0, {
      stat,
      value,
    });
  }
}

export { Effect, EffectFactory };
