import { TileAsJson } from "./Tile/TileAsJson";
import { GridAsJson } from "./Grid/GridAsJson";
import { FurnitureAsJson } from "./Furniture/FurnitureAsJson";

interface BoardAsJson {
  width: number;
  height: number;

  tiles: TileAsJson[][];
  doors: GridAsJson;
  walls: GridAsJson;
  furnitures: FurnitureAsJson[];
}

export type { BoardAsJson };
