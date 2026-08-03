import { TileType } from "../enums/Board/TileType";
import { TrapType } from "../enums/Board/TrapType";
import { MonsterCategory } from "../enums/Categories/MonsterCategory";
import { Direction } from "../enums/Direction";

export type SelectType =
  | TileType
  | TrapType
  | MonsterCategory
  | Direction
  | string
  | null;
