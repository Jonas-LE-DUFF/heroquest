import { WeaponRange } from "../../enums/WeaponRange";
import { WeaponAsJson } from "../../interfaces/ClassAsJson/Equipment/WeaponAsJson";
import { Item } from "./Item";

class Weapon extends Item {
  damage: number;
  range: WeaponRange;

  constructor(
    reference: string,
    name: string,
    cost: number,
    imagePath: string,
    damage: number,
    range: WeaponRange,
  ) {
    super(reference, name, cost, imagePath);
    this.damage = damage;
    this.range = range;
  }

  toJson(): WeaponAsJson {
    const baseJson = super.getBaseJson();
    return {
      ...baseJson,
      type: "Weapon",
      damage: this.damage,
      range: this.range,
    };
  }
}

export { Weapon };
