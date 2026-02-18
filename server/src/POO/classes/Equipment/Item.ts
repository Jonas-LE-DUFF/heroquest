import { randomUUID } from "crypto";

abstract class Item {
  id: string;
  reference: string;
  abstract type: string;
  name: string;
  cost: number;
  image: string;

  constructor(reference: string, name: string, cost: number, image: string) {
    this.id = randomUUID();
    this.reference = reference;
    this.name = name;
    this.cost = cost;
    this.image = image;
  }

  abstract toJson(): any;

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
