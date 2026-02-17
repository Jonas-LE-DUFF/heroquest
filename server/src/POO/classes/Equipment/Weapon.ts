import { WeaponRange } from "../../enums/WeaponRange";
import { WeaponAsJson } from "../../interfaces/ClassAsJson/Equipment/WeaponAsJson";
import { Item } from "./Item";

class Weapon extends Item {
  damage: number;
  range: WeaponRange;

  constructor(
    name: string,
    cost: number,
    imagePath: string,
    damage: number,
    range: WeaponRange,
  ) {
    super(name, cost, imagePath);
    this.damage = damage;
    this.range = range;
  }

  toJson(): WeaponAsJson {
    return {
      id: this.id,
      name: this.name,
      type: "Weapon",
      damage: this.damage,
      range: this.range,
      cost: this.cost,
    };
  }
}

export { Weapon };
