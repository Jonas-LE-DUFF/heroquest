import { randomUUID } from "crypto";

abstract class Item {
  id: string;
  name: string;
  cost: number;
  image: string;

  constructor(name: string, cost: number, image: string) {
    this.id = randomUUID();
    this.name = name;
    this.cost = cost;
    this.image = image;
  }
}

export { Item };
