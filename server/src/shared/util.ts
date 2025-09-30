import { GameState, PlayerRole, Position, SendableGameState } from "./type";

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
    id: game.id,
    board: game.board,
    players: Array.from(game.players.values()),
    monsters: Array.from(game.monsters.values()),
    ids: ids,
    positions: positons,
    turnOrder: game.turnOrder,
    currentTurn: game.currentTurn,
    status: game.status,
    walls: game.walls,
  };
}

function checkOnlyOneGameMaster(game: GameState) {
  if (game?.players)
    for (let player of game?.players.values()) {
      if (player.role === "game-master") {
        return false;
      }
    }
  return true;
}

function generateMonsterId(game: GameState) {
  let id = "idMonster" + Math.random().toString(16).slice(2);
  //checking the id is unique among monsters
  for (let monster of game.monsters.values()) {
    if (monster.id === id) {
      id = generateMonsterId(game);
    }
  }
  return id;
}

function fiveHeroPlayers(game: GameState, role: PlayerRole) {
  // checks if there is already 4 heros in the game and the value given is another hero

  return (
    game.players.size === 4 &&
    !game.turnOrder[4] && // if turnorder[4] is reserved for the game-master
    role === "hero"
  );
}

export {
  getAmountOfDices,
  convertGameStateAsSendableGameState,
  checkOnlyOneGameMaster,
  generateMonsterId,
  fiveHeroPlayers,
};
