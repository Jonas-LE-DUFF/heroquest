import { PotionAsJson } from "../../../interfaces/ClassAsJson/Equipment/PotionAsJson";
import { Item } from "../Item";

abstract class Potion extends Item {
  effect: string;

  constructor(name: string, cost: number, image: string, effect: string) {
    super(name, cost, image);
    this.effect = effect;
  }

  abstract applyEffect(target: any): boolean;

  toJson(): PotionAsJson {
    return {
      id: this.id,
      type: "Consummable",
      name: this.name,
      cost: this.cost,
      effect: this.effect,
    };
  }
}
class HealthPotion extends Potion {
  healingAmount: number;

  constructor(
    name: string,
    cost: number,
    image: string,
    effect: string,
    healingAmount: number,
  ) {
    super(name, cost, image, effect);
    this.healingAmount = healingAmount;
  }

  applyEffect(target: any): boolean {
    // Logic to heal the target
    console.log(`${target.name} is healed by ${this.healingAmount} points!`);
    return true;
  }
}

export { Potion, HealthPotion };
