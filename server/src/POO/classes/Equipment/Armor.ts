import { ArmorAsJson } from "../../interfaces/ClassAsJson/Equipment/ArmorAsJson";
import { Item } from "./Item";

class Armor extends Item {
  defenseValue: number;
  type: "chestPiece" | "helmet" | "shield";
  armorMovementDebuff: number = 0;

  constructor(
    name: string,
    cost: number,
    image: string,
    defenseValue: number,
    movementDebuff: number,
    type: "chestPiece" | "helmet" | "shield",
  ) {
    super(name, cost, image);
    this.defenseValue = defenseValue;
    this.armorMovementDebuff = movementDebuff;
    this.type = type;
  }

  toJson(): ArmorAsJson {
    return {
      id: this.id,
      type: "Armor",
      name: this.name,
      defense: this.defenseValue,
      movementPenalty: this.armorMovementDebuff,
      cost: this.cost,
    };
  }
}

export { Armor };
