import { PotionAsJson } from "../../../interfaces/ClassAsJson/Equipment/PotionAsJson";
import { Effect } from "../../Effects/Effects";
import { Item } from "./Item";
import { EffectType } from "../../../enums/Effects/EffectType";
import { EffectDuration } from "../../../enums/Effects/EffectDuration";
import { StatType } from "../../../enums/Effects/StatType";
import { rollRedDice } from "../../../../services/DiceService";
import { PlayerRole } from "../../../enums/PlayerRole";
import treasures from "../../../../shared/game_cards/treasure.json";
import equipments from "../../../../shared/game_cards/equipments.json"

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

class StrenghPotion extends ClassicPotion {
  constructor(equipmentData : equipmentData) {
    super(
      equipmentData,
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

class TreasurePotionFactory {
  createPotionFromReference(reference: string): Potion {
    const treasureData = treasures.deck.find((treasure) => treasure.id === reference)
    if(!treasureData) throw Error("unknown reference for potion : " + reference)
      const cleanTreasureData : equipmentData = {
        id : treasureData.id,
        name : treasureData.name,
        cost : 0,
        image_path: treasureData.img_path,
      }
    switch (reference) {
      case "strengh_potion":
        return new StrenghPotion(cleanTreasureData);
      case "heroisim_potion":
        return new HeroismPotion(cleanTreasureData);
      case "heal_potion":
        return new HealthPotion(cleanTreasureData)
      case "defense_potion":
        return new DefensePotion(cleanTreasureData)
      default:
        throw Error("unknown potion reference");
    }
  }
}

class EquipmentPotionFactory {
  createPotionFromReference(reference: string): Potion {
    const equipmentData = equipments.find(
      (equipment) => equipment.id === reference,
    );
    if (!equipmentData)
      throw Error("unknown reference for potion : " + reference);
    const cleanEquipmentData: equipmentData = {
      id: equipmentData.id,
      name: equipmentData.name,
      cost: equipmentData.cost,
      image_path: equipmentData.image_path,
    };
    switch (reference) {
      case "swift_potion":
        return new SwiftPotion(cleanEquipmentData);
      case "holy_water":
        return new HolyWater(cleanEquipmentData);
      default:
        throw Error("unknown potion reference");
    }
  }
}

export { Potion, TreasurePotionFactory, EquipmentPotionFactory };
