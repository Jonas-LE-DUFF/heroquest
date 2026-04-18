import { Board } from "../POO/classes/Board/Board";
import { Position } from "../POO/classes/Position/Position";
import { Game } from "../POO/classes/Server/Game";
import { Unit } from "../POO/classes/Units/Unit";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { MonsterCategory } from "../POO/enums/Categories/MonsterCategory";
import { Direction } from "../POO/enums/Direction";
import { TrapType } from "../POO/enums/Board/TrapType";

const canMove = (
  board: Board,
  from: Position,
  direction: Direction,
  unitMoved: Unit<HeroCategory | MonsterCategory>,
): { success: boolean; error?: string } => {
  const canPhaseThroughWalls = unitMoved.canPhaseThroughWalls();
  const canPhaseThroughMonsters = unitMoved.canPhaseThroughMonsters();
  const to = from.afterMove(direction);

  if (!to.isValid(board.BOARD_WIDTH, board.BOARD_HEIGHT)) {
    console.error("move out of bounds");
    return { success: false, error: "move out of bounds" };
  }

  const toTile = board.getTileAtPosition(to);
  if (!toTile) {
    console.error("destination tile not found");
    return { success: false, error: "destination tile not found" };
  }

  if (
    board.hasWallAt(from, direction) &&
    !board.hasDoorAt(from, direction) &&
    !canPhaseThroughWalls // A monster can't open doors
  ) {
    console.error("wall in the way");
    return { success: false, error: "wall in the way" };
  }

  if(toTile.isImpassable() && !canPhaseThroughWalls) {
    console.error("Tile is impassable");
    return { success: false, error: "Tile is impassable" };
  }

  const unit = board.getUnitAt(to);

  if (unit && !canPhaseThroughMonsters) {
    console.error("tile is occupied");
    return { success: false, error: "tile is occupied" };
  }
  return { success: true };
};

export async function moveUnit(
  board: Board,
  from: Position,
  direction: Direction,
  unitMoved: Unit<HeroCategory | MonsterCategory>,
): Promise<{ success: boolean; error?: string; }> {
  const moveCheck = canMove(board, from, direction, unitMoved);
  if (!moveCheck.success) {
    return moveCheck;
  }

  const to = from.afterMove(direction);
  const tile = board.getTileAtPosition(from);
  const newTile = board.getTileAtPosition(to);

  if (!tile || !newTile) {
    throw new Error("Tiles not found on board");
  }

  tile.unitId = null;
  newTile.unitId = unitMoved.id;

  if (newTile.trap) {
    await newTile.trap?.walkOnTrap(unitMoved);
  }

  if (
    unitMoved.effects.some((effect) => effect.name === "Pit Trap") &&
    newTile.trap?.getTrapType() !== TrapType.PIT_TRAP
  ) {
    unitMoved.removeEffectByName("Pit Trap");
  }
  return { success: true };
}

export function handleDoorOpening(
  board: Board,
  position: Position,
  direction: Direction,
): void {
  if (board.hasDoorAt(position, direction)) {
    board.openDoor(position, direction);
  }
}

export function getUnitToMove(
  game: Game,
  unitId: string,
  isGameMaster: boolean,
): Unit<HeroCategory | MonsterCategory> | null {
  let unitMoved: Unit<HeroCategory | MonsterCategory> | undefined;
  if (isGameMaster) {
    unitMoved = game?.gameState.getUnitById(unitId);
  } else {
    try {
      unitMoved = game?.getCurrentHeroTurn();
    } catch {
      console.error("couldn't get current hero turn");
      return null;
    }
  }
  return unitMoved || null;
}
