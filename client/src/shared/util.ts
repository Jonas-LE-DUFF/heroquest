import { GameState } from "./type";

function getPlayerFromId(game: GameState) {
  for (let player of game.players) {
    if (player.id === game.currentTurn) return player;
  }
  return null;
}

function getPlayerNameToTurn(game: GameState) {
  return getPlayerFromId(game)?.characterName;
}

function getRoleToTurn(game: GameState) {
  return getPlayerFromId(game)?.role;
}

function getPlayerRole(game: GameState, playerId: string | undefined) {
  if (!playerId) {
    console.error("player has no ID ???");
    return;
  }
  for (let player of game.players) {
    if (player.id === playerId) {
      return player.role;
    }
  }
  return null;
}

export { getPlayerNameToTurn, getRoleToTurn, getPlayerRole };
