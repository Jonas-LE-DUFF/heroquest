import { TileType } from "../../../enums/TileType";
import { HeroAsJson } from "../Unit/HeroAsJson";
import { MonsterAsJson } from "../Unit/MonsterAsJson";

interface TileAsJson {
    type: TileType;
    unit: HeroAsJson | MonsterAsJson |null;
}

export type { TileAsJson };