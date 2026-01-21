import { GameState, Monster, Player } from "../type";
import { positionKey } from "../util";

export function checkUnitDefeat(
  gameState: GameState,
  monsterTarget: Monster|Player
) {
  console.log("Checking defeat for monster:", monsterTarget);
  if (monsterTarget.stats?.hp === undefined || monsterTarget.stats.hp > 0) {
    console.log(monsterTarget.stats?.hp, "HP remaining. Monster not defeated.");
    return gameState;
  }
  console.log(`Monster ${monsterTarget.id} defeated.`);
  gameState.monsters.delete(monsterTarget.id);
  const pos = gameState.entityPositions.get(monsterTarget.id);
  if (!pos) {
    console.error(
      `Position for monster ${monsterTarget.id} not found during defeat check.`
    );
    return gameState;
  }
  gameState.positionEntities.delete(positionKey(pos));
  gameState.entityPositions.delete(monsterTarget.id);

  return gameState;
}
