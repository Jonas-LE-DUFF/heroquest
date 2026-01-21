class Equipment extends Item {
    gold: number;
    weapons: Weapon[];


    constructor(id: string, name: string, cost: number, gold: number, weapons: Weapon[]) {
        super(id, name, cost);
        this.gold = gold;
        this.weapons = weapons;
    }
}