import { WeaponRange } from "../../../enums/WeaponRange";
import { WeaponAsJson } from "../../../interfaces/ClassAsJson/Equipment/WeaponAsJson";
import { CarryOptions, Item } from "./Item";

class Weapon extends Item {
  damage: number;
  range: WeaponRange;
  type = "Weapon";

  constructor(
    reference: string,
    name: string,
    cost: number,
    imagePath: string,
    canClericCarry: CarryOptions = "true",
    damage: number,
    range: WeaponRange,
  ) {
    super(reference, name, cost, imagePath, canClericCarry);
    this.damage = damage;
    this.range = range;
  }

  toJson(): WeaponAsJson {
    const baseJson = super.getBaseJson();
    return {
      ...baseJson,
      damage: this.damage,
      range: this.range,
    };
  }
}

export { Weapon };
