import { DoorGridAsJson } from "./Grid/DoorGridAsJson";
import { WallGridAsJson } from "./Grid/WallGridAsJson";
import { TileAsJson } from "./TileAsJson";

interface BoardAsJson {
    width: number;
    height: number;

    tiles: TileAsJson[][];
    doors: DoorGridAsJson;
    walls: WallGridAsJson;
}

export type { BoardAsJson };