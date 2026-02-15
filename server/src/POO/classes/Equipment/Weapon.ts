import { WeaponAsJson } from "../../interfaces/ClassAsJson/Equipment/WeaponAsJson";
import { Item } from "./Item";

class Weapon extends Item{
    damage: number;
    range: "melee" | "ranged" | "long-melee";

    constructor(id: string, name: string, cost: number, imagePath: string, damage: number, range: "melee" | "ranged" | "long-melee") {
        super(id, name, cost, imagePath);
        this.damage = damage;
        this.range = range;
    }

    toJson(): WeaponAsJson {
        return {
            id: this.id,
            name: this.name,
            damage: this.damage,
            range: this.range,
            cost: this.cost,
        };
    }

}

export { Weapon };