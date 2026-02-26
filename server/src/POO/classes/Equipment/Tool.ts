import { ItemAsJson } from "../../interfaces/ClassAsJson/Equipment/ItemAsJson";
import { Item } from "./Item";

class Tool extends Item {
    type="Tool"
    constructor(reference: string, name: string, cost: number, image: string) {
        super(reference, name, cost, image);
    }
    toJson() : ItemAsJson {
        const baseJson = super.getBaseJson()
        return {...baseJson }
    }
}

export {Tool}