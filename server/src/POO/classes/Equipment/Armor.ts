import { ArmorAsJson } from "../../interfaces/ClassAsJson/Equipment/ArmorAsJson";
import { Item } from "./Item";

class Armor extends Item {
  defenseValue: number;
  type: "chestPiece" | "helmet" | "shield";
  armorMovementDebuff: number = 0;

  constructor(
    reference: string,
    name: string,
    cost: number,
    image: string,
    defenseValue: number,
    movementDebuff: number,
    type: "chestPiece" | "helmet" | "shield",
  ) {
    super(reference, name, cost, image);
    this.defenseValue = defenseValue;
    this.armorMovementDebuff = movementDebuff;
    this.type = type;
  }

  toJson(): ArmorAsJson {
    const baseJson = this.getBaseJson();
    return {
      ...baseJson,
      type: "Armor",
      defense: this.defenseValue,
      movementPenalty: this.armorMovementDebuff,
    };
  }
}

export { Armor };
