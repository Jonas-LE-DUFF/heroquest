import {
  GameState,
  Monster,
  Player,
  Position,
  SendableGameState,
} from "./type";

function convertSendableGameStateAsGameState(
  game: SendableGameState
): GameState {
  const players: Map<string, Player> = new Map<string, Player>();
  const monsters: Map<string, Monster> = new Map<string, Monster>();
  const entityPositions: Map<string, Position> = new Map<string, Position>();
  const positionEntities: Map<Position, string> = new Map<Position, string>();

  game.players.forEach((player: Player) => {
    players.set(player.id, player);
  });

  game.monsters.forEach((monster: Monster) => {
    monsters.set(monster.id, monster);
  });

  if (game.ids && game.positions) {
    game.ids.forEach((id, index) => {
      const position = game.positions[index];
      if (id && position) {
        entityPositions.set(id, position);
        positionEntities.set(position, id);
      }
    });
  }

  return {
    id: game.id,
    board: game.board,
    players: players,
    monsters: monsters,
    entityPositions: entityPositions,
    positionEntities: positionEntities,
    turnOrder: game.turnOrder,
    currentTurn: game.currentTurn,
    status: game.status,
    walls: game.walls,
  };
}

function everyOneReady(game: GameState) {
  const players = game.players.values();
  for (let player of players) {
    if (!player.ready) return false;
  }
  return true;
}

export { convertSendableGameStateAsGameState, everyOneReady };
