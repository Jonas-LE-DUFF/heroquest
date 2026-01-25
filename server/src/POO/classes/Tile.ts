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
}

export { Tile };