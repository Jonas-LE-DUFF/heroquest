import { PotionAsJson } from "../../../interfaces/ClassAsJson/Equipment/PotionAsJson";
import { Effect } from "../../Effects/Effects";
import { Item } from "./Item";
import { EffectType } from "../../../enums/Effects/EffectType";
import { EffectDuration } from "../../../enums/Effects/EffectDuration";
import { StatType } from "../../../enums/Effects/StatType";
import { rollRedDice } from "../../../../services/DiceService";
import { PlayerRole } from "../../../enums/PlayerRole";

abstract class Potion extends Item {
  effect: Effect | null;
  type = "Potion";

  constructor(
    reference: string,
    name: string,
    cost: number,
    image: string,
    effect: Effect | null,
  ) {
    super(reference, name, cost, image);
    this.effect = effect;
  }

  abstract applyEffect(
    gameId: string,
    target: any,
  ): { success: boolean; error?: string };

  toJson(): PotionAsJson {
    const baseJson = this.getBaseJson();
    return {
      ...baseJson,
      effect: this.effect?.name || "No effect",
    };
  }
}

interface equipmentData {
  id: string;
  name: string;
  cost: number;
  image_path: string;
  type: string;
  modifiers: {
    stat?: string;
    amount?: number;
    operation?: string;
  };
}

abstract class ClassicPotion extends Potion {
  constructor(equipementData: equipmentData, effect: Effect) {
    super(
      equipementData.id,
      equipementData.name,
      equipementData.cost,
      equipementData.image_path,
      effect,
    );
  }

  applyEffect(
    gameId: string,
    target: any,
  ): { success: boolean; error?: string } {
    // Logic to apply the effect to the target
    console.log(`${target.name} is affected by Swift Potion!`);
    target.effects.push(this.effect);
    return { success: true };
  }
}

class SwiftPotion extends ClassicPotion {
  constructor(equipementData: equipmentData) {
    super(
      equipementData,
      new Effect(
        "Swift Potion Effect",
        EffectType.STAT_MULTIPLIER,
        EffectDuration.ONE_TURN,
        true,
        { stat: StatType.MOVEMENT, value: 2 },
      ),
    );
  }
}

class HolyWater extends Potion {
  constructor(equipementData: equipmentData) {
    super(
      equipementData.id,
      equipementData.name,
      equipementData.cost,
      equipementData.image_path,
      null,
    );
  }

  applyEffect(
    gameId: string,
    target: any,
  ): { success: boolean; error?: string } {
    return {
      success: false,
      error:
        "Veuillez demander au game master d'appliquer cette potion manuellement",
    };
  }
}

class HealthPotion extends Potion {
  constructor(equipementData: equipmentData) {
    super(
      equipementData.id,
      equipementData.name,
      0,
      equipementData.image_path,
      null,
    );
  }

  applyEffect(
    gameId: string,
    target: any,
  ): { success: boolean; error?: string } {
    console.log(`${target.name} is affected by Health Potion!`);

    rollRedDice(gameId, 1, PlayerRole.HERO).then((diceResult) => {
      if (!diceResult.success) {
        console.error("Failed to roll dice for Health Potion:");
        throw new Error("Failed to roll dice for Health Potion");
      }
      const heal = diceResult.results[0];
      target.health = Math.min(target.maxHealth, target.health + heal);
    });

    return { success: true };
  }
}

class DefensePotion extends ClassicPotion {
  constructor(equipementData: equipmentData) {
    super(
      equipementData,
      new Effect(
        "Defense Potion Effect",
        EffectType.STAT_MODIFIER,
        EffectDuration.UNTIL_STAT_USED,
        true,
        { stat: StatType.DEFENSE, value: 2 },
      ),
    );
  }
}

class StrengthPotion extends ClassicPotion {
  constructor(equipementData: equipmentData) {
    super(
      equipementData,
      new Effect(
        "Strength Potion Effect",
        EffectType.STAT_MODIFIER,
        EffectDuration.UNTIL_STAT_USED,
        true,
        { stat: StatType.ATTACK, value: 2 },
      ),
    );
  }
}

class HeroismPotion extends Potion {
  constructor(equipementData: equipmentData) {
    super(
      equipementData.id,
      equipementData.name,
      equipementData.cost,
      equipementData.image_path,
      null,
    );
  }

  applyEffect(
    gameId: string,
    target: any,
  ): { success: boolean; error?: string } {
    return {
      success: false,
      error:
        "Veuillez demander au game master d'appliquer cette potion manuellement",
    };
  }
}

export {
  Potion,
  SwiftPotion,
  HolyWater,
  HealthPotion,
  DefensePotion,
  StrengthPotion,
  HeroismPotion,
};
