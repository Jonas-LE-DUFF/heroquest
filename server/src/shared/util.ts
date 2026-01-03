import { Server } from "socket.io";
import { rollFightDice } from "../controllers/dicesControllers";
import {
  diceFace,
  GameState,
  heroClass,
  Monster,
  Player,
  PlayerRole,
  Position,
  SendableGameState,
  Unit,
} from "./type";
import { checkUnitDefeat } from "./death/death";

function isPlayer(u: Monster | Player): u is Player {
  return !u.id.match(/^idMonster/);
}

function getAmountOfDices(
  game: GameState,
  playerId: string,
  attOrDef: "att" | "def"
) {
  const player = game.players.get(playerId);
  if (player?.stats === null || player?.stats === undefined) {
    console.error("no stats on player");
    return;
  }
  const stats: Unit = player.stats;
  return attOrDef === "att" ? stats.nbAttackDice : stats.nbDefenseDice;
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
    doors: game.doors,
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

function getPlayerByClass(
  gameState: GameState,
  playerClass: heroClass
): string | null {
  for (const [playerId, player] of gameState.players.entries()) {
    if (player.class === playerClass) {
      return playerId;
    }
  }
  return null;
}

function getGameMasterId(gameState: GameState): string | null {
  return gameState.turnOrder[4] || null;
}

function convertSendableGameStateAsGameState(
  game: SendableGameState
): GameState {
  const players: Map<string, Player> = new Map<string, Player>();
  const monsters: Map<string, Monster> = new Map<string, Monster>();
  const entityPositions: Map<string, Position> = new Map<string, Position>();
  const positionEntities: Map<string, string> = new Map<string, string>();

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
        positionEntities.set(positionKey(position), id);
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
    doors: game.doors,
  };
}

async function fight(
  io: Server,
  gameState: GameState,
  attacker: Player | Monster,
  defender: Player | Monster,
  nbAttackDice?: number,
  nbDefenseDice?: number
) {
  if (!attacker.stats || !defender.stats) {
    throw new Error("Player or monster stats not found.");
  }
  const attackDice =
    nbAttackDice !== undefined
      ? nbAttackDice
      : attacker.stats.nbAttackDice;
  const defenseDice =
    nbDefenseDice !== undefined
      ? nbDefenseDice
      : defender.stats.nbDefenseDice;
  const roll = await rollFightDice(io, attacker.id, gameState, 5);
        if(!roll.success || !roll.results) {
          throw new Error("Failed to roll fight dice for Djinn DIE spell.");
        }
        const playerThrow = roll.results || [];
        const monsterRoll = await rollFightDice(io, getGameMasterId(gameState) || "", gameState, defender.stats?.nbDefenseDice || 0);
        if(!monsterRoll.success || !monsterRoll.results) {
          throw new Error("Failed to roll fight dice for Djinn DIE spell monster.");
        }
        const monsterThrow = monsterRoll.results || [];
        const damageDealt = (playerThrow.filter(d => d == diceFace.Hit).length) - monsterThrow.filter(d => d == diceFace.BlackShield).length;
        if(damageDealt > 0) {
          if(defender.stats?.hp === undefined) {
            throw new Error("Monster target has no health stat.");
          }
          defender.stats.hp -= damageDealt;
          if(!isPlayer(defender))
            checkUnitDefeat(gameState, defender);
        }
  
}

const positionKey = (pos: Position) => `${pos.x},${pos.y}`;

export {
  isPlayer,
  getAmountOfDices,
  convertGameStateAsSendableGameState,
  convertSendableGameStateAsGameState,
  checkOnlyOneGameMaster,
  generateMonsterId,
  fiveHeroPlayers,
  positionKey,
  getPlayerByClass,
  getGameMasterId,
  fight,
};
