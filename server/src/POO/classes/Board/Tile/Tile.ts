import { TileType } from "../../../enums/Board/TileType";
import { TrapType } from "../../../enums/Board/TrapType";
import { TileAsJson } from "../../../interfaces/ClassAsJson/Board/TileAsJson";
import { PitTrap, RockTrap, SpearTrap, Trap } from "./Trap";

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

  placeTrap(trap: TrapType): void {
    switch (trap) {
      case TrapType.PIT_TRAP:
        this.trap = new PitTrap(trap);
        break;
      case TrapType.SPEAR_TRAP:
        this.trap = new SpearTrap(trap);
        break;
      case TrapType.ROCK_TRAP:
        this.trap = new RockTrap(trap);
        break;
      default:
        throw new Error("Invalid trap type");
    }
  }

  toJson(): TileAsJson {
    return {
      type: this.type,
      unitId: this.unitId,
      // should show trap details only if it's revealed or if its game master view
      trap: this.trap ? this.trap.toJson() : null,
    };
  }
}

export { Tile };
