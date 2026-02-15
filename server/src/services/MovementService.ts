import { Board } from "../POO/classes/Board/Board";
import { Position } from "../POO/classes/Position/Position";
import { Game } from "../POO/classes/Server/Game";
import { Unit } from "../POO/classes/Units/Unit";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { MonsterCategory } from "../POO/enums/Categories/MonsterCategory";
import { Direction } from "../POO/enums/Direction";
import { PlayerRole } from "../POO/enums/PlayerRole";

const canMove = (
  board: Board,
  from: Position,
  direction: Direction,
  unitMoved: Unit<HeroCategory | MonsterCategory>,
): { success: boolean; error?: string } => {
  const isHero =
    unitMoved instanceof Unit && unitMoved.getCategory() === PlayerRole.HERO;
  const canPhaseThroughWalls = unitMoved.canPhaseThroughWalls();
  const canPhaseThroughMonsters = unitMoved.canPhaseThroughMonsters();
  const to = from.afterMove(direction);

  if (!to.isValid(board.BOARD_WIDTH, board.BOARD_HEIGHT)) {
    console.error("move out of bounds");
    return { success: false, error: "move out of bounds" };
  }

  if (
    board.hasWallAt(from, direction) &&
    !board.hasDoorAt(from, direction) &&
    !isHero &&
    !canPhaseThroughWalls // A monster can't open doors
  ) {
    console.error("wall in the way");
    return { success: false, error: "wall in the way" };
  }

  const unit = board.getUnitAt(to);

  if (unit && !canPhaseThroughMonsters) {
    console.error("tile is occupied");
    return { success: false, error: "tile is occupied" };
  }
  return { success: true };
};

export function moveUnit(
  board: Board,
  from: Position,
  direction: Direction,
  unitMoved: Unit<HeroCategory | MonsterCategory>,
): { success: boolean; error?: string } {
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
  tile.unit = null;
  newTile.unit = unitMoved;
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
