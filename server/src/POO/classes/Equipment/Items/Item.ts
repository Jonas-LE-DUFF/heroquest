import { randomUUID } from "crypto";
import { ItemAsJson } from "../../../interfaces/ClassAsJson/Equipment/ItemAsJson";

export type CarryOptions = "true" | "false" | "only";

abstract class Item {
  id: string; // a unique identifier for this specific item instance, generated when the item is created
  reference: string; // the name of the item in the json file
  abstract type: string;
  name: string;
  cost: number;
  image: string;
  canClericCarry: CarryOptions = "true";

  constructor(
    reference: string,
    name: string,
    cost: number,
    image: string,
    canClericCarry: CarryOptions = "true",
  ) {
    this.id = randomUUID();
    this.reference = reference;
    this.name = name;
    this.cost = cost;
    this.image = image;
    this.canClericCarry = canClericCarry;
  }

  abstract toJson(): ItemAsJson;

  protected getBaseJson() {
    return {
      id: this.reference,
      name: this.name,
      cost: this.cost,
      image_path: this.image,
      type: this.type,
    };
  }
}

export { Item };
