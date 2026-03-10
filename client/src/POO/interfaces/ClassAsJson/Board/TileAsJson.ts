import { TileType } from "../../../enums/TileType";

interface TileAsJson {
  type: TileType;
  unitId: string | null;
}

export type { TileAsJson };
