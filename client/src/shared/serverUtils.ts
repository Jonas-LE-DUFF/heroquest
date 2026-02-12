import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { GameAsJson } from "../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { PlayerAsJson } from "../POO/interfaces/ClassAsJson/Server/PlayerAsJson";
import { HeroAsJson } from "../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { MonsterAsJson } from "../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";

function getPlayerByHero(
  hero: HeroAsJson,
  players: PlayerAsJson[],
): PlayerAsJson | null {
  const player = players.find((p) => p.id === hero.controlledByPlayerId);
  return player || null;
}

function getHeroes(heroes: (HeroAsJson | MonsterAsJson)[]): HeroAsJson[] {
  return heroes.filter(
    (entity): entity is HeroAsJson => "controlledByPlayerId" in entity,
  );
}

function getPlayerByHeroCategory(
  heroCategory: HeroCategory,
  game: GameAsJson,
): PlayerAsJson | null {
  const players = game.players;
  const heroes = getHeroes(game.gameState.Units);
  for (let hero of heroes) {
    if (hero.category === heroCategory) {
      const player = players.find((p) => p.id === hero.controlledByPlayerId);
      return player || null;
    }
  }
  return null;
}

function getPlayerBySocketId(
  socketId: string,
  game: GameAsJson,
): PlayerAsJson | null {
  const player = game.players.find((p) => p.id === socketId) || null;
  return player;
}

function getHeroByPlayerId(
  playerId: string,
  game: GameAsJson,
): HeroAsJson | null {
  const heroes = getHeroes(game.gameState.Units);
  for (let entity of heroes) {
    if (
      "controlledByPlayerId" in entity &&
      entity.controlledByPlayerId === playerId
    ) {
      return entity as HeroAsJson;
    }
  }
  return null;
}

function getPlayerIdToPlay(game: GameAsJson): string | undefined {
  if (game.isMonsterTurn) {
    return getGameMasterId(game); // during the monster turn it's the game master to play
  }
  const playerCategoryToPlay = game.playOrder[game.currentTurnIndex];
  const playerToPlay = getPlayerByHeroCategory(playerCategoryToPlay, game);
  return playerToPlay?.id;
}

function getGameMasterId(game: GameAsJson): string | undefined {
  return game.players.find((p) => p.role === PlayerRole.GAME_MASTER)?.id;
}

export {
  getPlayerByHero,
  getHeroes,
  getPlayerByHeroCategory,
  getHeroByPlayerId,
  getPlayerBySocketId,
  getPlayerIdToPlay,
};
