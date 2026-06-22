import { ArmorType } from "../../../enums/ArmorType";
import { ArmorAsJson } from "../../../interfaces/ClassAsJson/Equipment/ArmorAsJson";
import { Item } from "./Item";

class Armor extends Item {
  defenseValue: number;
  armorType: ArmorType;
  type: string = "Armor";
  armorMovementDebuff: number = 0;

  constructor(
    reference: string,
    name: string,
    cost: number,
    image: string,
    canClericCarry: boolean = true,
    defenseValue: number,
    movementDebuff: number,
    armorType: ArmorType,
  ) {
    super(reference, name, cost, image, canClericCarry);
    this.defenseValue = defenseValue;
    this.armorMovementDebuff = movementDebuff;
    this.armorType = armorType;
  }

  toJson(): ArmorAsJson {
    const baseJson = this.getBaseJson();
    return {
      ...baseJson,
      defense: this.defenseValue,
      movementPenalty: this.armorMovementDebuff,
      armorType: this.armorType,
    };
  }
}

export { Armor };
