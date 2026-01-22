import { Unit } from "./Units/Unit";

class Tile {
    Unit : Unit<any> | null;
    type : "empty" | "wall" | "trap" | "treasure" | "spawn-point";
    
    constructor(type: "empty" | "wall" | "trap" | "treasure" | "spawn-point") {
        this.type = type;
        this.Unit = null;
    }
}

export { Tile };