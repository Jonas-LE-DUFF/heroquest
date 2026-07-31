import { Direction } from "../../../../enums/Direction";

export interface FurnitureAsJson {
  position: { x: number; y: number };
  furnitureType: string;
  direction: Direction;
  length: number;
  width: number;
}
