class Weapon {
    damage: number;
    range: number;
    type: "melee" | "ranged";

    constructor(damage: number, range: number, type: "melee" | "ranged") {
        this.damage = damage;
        this.range = range;
        this.type = type;
    }

}