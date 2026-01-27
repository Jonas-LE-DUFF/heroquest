import { Item } from "./Item";

class Weapon extends Item{
    damage: number;
    range: "melee" | "ranged" | "long-melee";

    constructor(id: string, name: string, cost: number, imagePath: string, damage: number, range: "melee" | "ranged" | "long-melee") {
        super(id, name, cost, imagePath);
        this.damage = damage;
        this.range = range;
    }

}

export { Weapon };