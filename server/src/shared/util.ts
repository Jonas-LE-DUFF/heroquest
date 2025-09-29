import { GameState, Position, SendableGameState } from "./type";

function getAmountOfDices(
  game: GameState,
  playerId: string,
  attOrDef: "att" | "def"
) {
  const player = game.players.get(playerId);
  if (!player?.stats) {
    console.error("no stats on player");
    return;
  }
  return attOrDef === "att"
    ? player.stats.nbAttackDice
    : player.stats.nbDefenseDice;
}

function convertGameStateAsSendableGameState(
  game: GameState
): SendableGameState {
  const positons: Position[] = [];
  const ids: string[] = [];
  game.entityPositions.forEach((value: Position, key: string) => {
    positons.push(value);
    ids.push(key);
  });
  return {
    ...game,
    players: Array.from(game.players.values()),
    monsters: Array.from(game.monsters.values()),
    ids: ids,
    positions: positons,
  };
}

export { getAmountOfDices, convertGameStateAsSendableGameState };
