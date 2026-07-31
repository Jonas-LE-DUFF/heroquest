import { TileType } from "../../../../enums/Board/TileType";
import { TrapAsJson } from "./TrapAsJson";

interface TileAsJson {
  type: TileType;
  unitId: string | null;
  transientUnitId: string | null; // When a unit is moving on a tile it could not normally be on
  trap: TrapAsJson | null;
}

export type { TileAsJson };
