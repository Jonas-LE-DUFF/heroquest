import { HeroCategory } from "../enums/Categories/HeroCategory";
import { MonsterCategory } from "../enums/Categories/MonsterCategory";
import { TileType } from "../enums/TileType";
import { Unit } from "./Units/Unit";

class Tile {
    unit : Unit<HeroCategory | MonsterCategory> | null;
    type : TileType
    
    constructor(type: TileType) {
        this.type = type;
        this.unit = null;
    }

    /**
     * clears the tile
     * @returns the unit removed when clearing or null if there were no unit
     */
    eraseTile() : Unit<HeroCategory | MonsterCategory> | null {
        this.type = TileType.FLOOR;
        const unitRemoved = this.unit;
        this.unit = null;
        return unitRemoved;
    }

    isOccupied() : boolean {
        return this.type !== TileType.FLOOR || this.unit !== null;
    }
}

export { Tile };