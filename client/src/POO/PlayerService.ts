import { getHeroesByPlayerId } from "../shared/serverUtils";
import { HeroCategory } from "./enums/Categories/HeroCategory";
import { GameAsJson } from "./interfaces/ClassAsJson/Server/GameAsJson";
import { HeroAsJson } from "./interfaces/ClassAsJson/Unit/HeroAsJson";

class PlayerService {
  public static getHeroByCategory(
    game: GameAsJson,
    playerId: string,
    category: HeroCategory,
  ): HeroAsJson | null {
    const heroes = getHeroesByPlayerId(playerId, game);
    if (!heroes) {
      return null;
    }
    const hero = heroes.find((unit) => unit.category === category);
    return hero ?? null;
  }

  public static getHeroSelectedWeapon(hero: HeroAsJson | null): string | null {
    if (!hero) return null;
    return (
      hero.equipment.weapons[hero.equipment.selectedWeaponIndex]?.id || null
    );
  }
}

export { PlayerService };
