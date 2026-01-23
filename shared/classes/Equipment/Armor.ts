import { Item } from "./Item";

class Armor extends Item {
    defenseValue: number;
    type: "chestPiece" | "helmet" | "shield";
    armorMovementDebuff: number = 0;

    constructor(id: string, name: string, cost: number, image: string, defenseValue: number, movementDebuff: number, type: "chestPiece" | "helmet" | "shield") {
        super(id, name, cost, image);
        this.defenseValue = defenseValue;
        this.armorMovementDebuff = movementDebuff;
        this.type = type;
    }
}

export { Armor };