import { TileType } from "../../../enums/Board/TileType";
import { TileAsJson } from "../../../interfaces/ClassAsJson/Board/TileAsJson";
import { Trap } from "./Trap";

class Tile {
  unitId: string | null;
  type: TileType;
  trap: Trap | null;

  constructor(type: TileType) {
    this.type = type;
    this.unitId = null;
    this.trap = null;
  }

  /**
   * clears the tile
   * @returns the unit's id removed when clearing or null if there were no unit
   */
  eraseTile(): string | null {
    this.type = TileType.FLOOR;
    const unitRemovedId = this.unitId;
    this.unitId = null;
    return unitRemovedId;
  }

  isImpassable(): boolean {
    return (
      this.type === TileType.WALL ||
      this.type === TileType.FURNITURE ||
      this.type === TileType.TREASURE
    );
  }

  isOccupied(): boolean {
    return (
      (this.type !== TileType.FLOOR &&
        this.type !== TileType.SPAWN_POINT &&
        this.type !== TileType.TRAP) ||
      this.unitId !== null
    );
  }

  toJson(): TileAsJson {
    return {
      type: this.type,
      unitId: this.unitId,
      // should show trap details only if it's revealed or if its game master view
      trap: this.trap?.isRevealed ? this.trap.toJson() : null,
    };
  }
}

export { Tile };
