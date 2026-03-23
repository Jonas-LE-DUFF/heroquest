import { TileType } from "../../../enums/Board/TileType";
import { TrapAsJson } from "./TrapAsJson";

interface TileAsJson {
  type: TileType;
  unitId: string | null;
  trap: TrapAsJson | null;
}

export type { TileAsJson };
