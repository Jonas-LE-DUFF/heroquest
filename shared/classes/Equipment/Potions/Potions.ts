import { Item } from "../Item";

abstract class Potion extends Item {
    effect: string;

    constructor(id: string, name: string, cost: number, image: string, effect: string) {
        super(id, name, cost, image);
        this.effect = effect;
    }

    abstract applyEffect(target: any): boolean;
}

export { Potion };