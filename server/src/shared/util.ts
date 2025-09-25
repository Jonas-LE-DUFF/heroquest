import { GameState } from "./type";

function getPlayerFromId(game: GameState, playerId: string) {
  for (let player of game.players) {
    if (player.id === playerId) return player;
  }
  return null;
}

function getCurrentPlayer(game: GameState) {
  if (!game.currentTurn) {
    console.log("no ones turn ?");
    return;
  }
  return getPlayerFromId(game, game.currentTurn);
}

function getPlayerNameToTurn(game: GameState) {
  return getCurrentPlayer(game)?.characterName;
}

function getRoleToTurn(game: GameState) {
  return getCurrentPlayer(game)?.role;
}

function getPlayerRole(game: GameState, playerId: string | undefined) {
  if (!playerId) {
    console.error("player has no ID ???");
    return;
  }
  return getPlayerFromId(game, playerId)?.role;
}

function getAmountOfDices(
  game: GameState,
  playerId: string,
  attOrDef: "att" | "def"
) {
  const player = getPlayerFromId(game, playerId);
  if (!player?.stats) {
    console.error("no stats on player");
    return;
  }
  return attOrDef === "att"
    ? player.stats.nbAttackDice
    : player.stats.nbDefenseDice;
}

export { getPlayerNameToTurn, getRoleToTurn, getPlayerRole, getAmountOfDices };
