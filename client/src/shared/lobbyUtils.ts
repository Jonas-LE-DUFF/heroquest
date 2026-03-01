import { GameAsJson } from "../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { PlayerAsJson } from "../POO/interfaces/ClassAsJson/Server/PlayerAsJson";
import { HeroAsJson } from "../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { isHero } from "./utils";

function getPlayerHeroMap(game: GameAsJson): Map<PlayerAsJson, HeroAsJson[]> {
  const playerHeroMap = new Map<PlayerAsJson, HeroAsJson[]>();
  game.gameState.Units.forEach((unit) => {
    if (!isHero(unit)) {
      return;
    }
    const hero = unit as HeroAsJson;
    const player = game.players.find((p) => p.id === hero.controlledByPlayerId);
    if (!player) {
      console.warn(
        `Aucun joueur trouvé pour l'ID ${hero.controlledByPlayerId} du héros ${hero.name}`,
      );
      return;
    }
    const existingHeroes = playerHeroMap.get(player) || [];
    playerHeroMap.set(player, [...existingHeroes, hero]);
  });
  return playerHeroMap;
}

export { getPlayerHeroMap };
