import { Unit } from "./Units/Unit";

class Tile {
    Unit : Unit<any> | null;
    type : TileType
    
    constructor(type: TileType) {
        this.type = type;
        this.Unit = null;
    }
}

export { Tile };