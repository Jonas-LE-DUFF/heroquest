import { TileType } from "../../../enums/Board/TileType";
import { TrapType } from "../../../enums/Board/TrapType";
import { TileAsJson } from "../../../interfaces/ClassAsJson/Board/TileAsJson";
import { PitTrap, RockTrap, SpearTrap, Trap } from "./Trap";
import { logger } from "../../../../utils/logger";

class Tile {
  unitId: string | null;
  transientUnitId: string | null = null; // used to temporarily store a unit's id when it moves through another unit
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

  placeTrap(gameId: string, trap: TrapType): void {
    switch (trap) {
      case TrapType.PIT_TRAP:
        this.trap = new PitTrap(gameId);
        break;
      case TrapType.SPEAR_TRAP:
        this.trap = new SpearTrap(gameId);
        break;
      case TrapType.ROCK_TRAP:
        this.trap = new RockTrap(gameId);
        break;
      default:
        throw new Error("Invalid trap type");
    }
  }

  placeUnit(unitId: string): void {
    if (!this.unitId) {
      this.unitId = unitId;
      return;
    }
    if (!this.transientUnitId) {
      this.transientUnitId = unitId;
      logger.warn(
        "A unit is already present on the tile, placing the new unit in transient state",
      );
      return;
    }
    // this should never happen, a player cannot stop on a tile occupied by another unit and only one unit can be moving at a time, but we throw an error just in case
    throw new Error(
      "Tile is already occupied by two units, cannot place another one",
    );
  }

  removeDesignatedUnit(unitId: string): string | null {
    if (this.transientUnitId === unitId) {
      this.transientUnitId = null;
      return unitId;
    }
    if (this.unitId === unitId) {
      this.unitId = null;
      return unitId;
    }
    return null;
  }

  toJson(gameMaster: boolean = false): TileAsJson {
    return {
      type: this.type,
      unitId: this.unitId,
      transientUnitId: this.transientUnitId,
      // should show trap details only if it's revealed or if its game master view
      trap:
        this.trap && (this.trap.isRevealed || gameMaster)
          ? this.trap.toJson()
          : null,
    };
  }
}

export { Tile };
