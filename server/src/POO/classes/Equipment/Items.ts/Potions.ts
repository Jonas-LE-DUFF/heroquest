import { PotionAsJson } from "../../../interfaces/ClassAsJson/Equipment/PotionAsJson";
import { Effect } from "../../Effects/Effects";
import { Item } from "./Item";
import { EffectType } from "../../../enums/Effects/EffectType";
import { EffectDuration } from "../../../enums/Effects/EffectDuration";
import { StatType } from "../../../enums/Effects/StatType";
import { Monster } from "../../Units/Monster";
import { MonsterType } from "../../../enums/MonsterType";
import { dealDamage } from "../../../../services/CombatService";

abstract class Potion extends Item {
  effect: Effect;
  type = "Potion";

  constructor(
    reference: string,
    name: string,
    cost: number,
    image: string,
    effect: Effect,
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
      effect: this.effect.name,
    };
  }

  static createPotionFromReference(id: string) {
    throw new Error("Method not implemented.");
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

class SwiftPotion extends Potion {
  constructor(equipementData: equipmentData) {
    super(
      equipementData.id,
      equipementData.name,
      equipementData.cost,
      equipementData.image_path,
      new Effect(
        "Swift Potion Effect",
        EffectType.STAT_MULTIPLIER,
        EffectDuration.ONE_TURN,
        true,
        { stat: StatType.MOVEMENT, value: 2 },
      ),
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

class HolyWater extends Potion {
  constructor(equipementData: equipmentData) {
    super(
      equipementData.id,
      equipementData.name,
      equipementData.cost,
      equipementData.image_path,
      new Effect(
        "No Effect",
        EffectType.STAT_MULTIPLIER,
        EffectDuration.ONE_TURN,
        true,
      ),
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

export { Potion, SwiftPotion, HolyWater };
