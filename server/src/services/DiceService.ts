import { Game } from "../POO/classes/Server/Game";
import { FightDiceFaces } from "../POO/enums/Dices/FightDiceFaces";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { SpecialAuthorizedHero } from "../POO/interfaces/SpecialAuthorizedHero";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { IDiceService } from "../POO/interfaces/IClass/IDiceService";

const sleep = (ms: number) => {
  return new Promise((r) => setTimeout(r, ms));
};

export class DiceService implements IDiceService {
  async rollFightDice(
    gameId: string,
    wishedNumberOfDices: number,
    playerRole: PlayerRole,
  ): Promise<{ success: boolean; results?: FightDiceFaces[]; error?: string }> {
    const io = ServerHeroQuest.getServerInstance().getIo();

    let results: FightDiceFaces[] = [];
    for (let j = 0; j < 15; j++) {
      results = [];
      for (let i = 0; i < wishedNumberOfDices; i++) {
        const randomNumber = Math.floor(Math.random() * 6 + 1);
        let face: FightDiceFaces = FightDiceFaces.Hit;
        if (randomNumber === 1) {
          face = FightDiceFaces.BlackShield;
        } else if (randomNumber < 3) {
          face = FightDiceFaces.WhiteShield;
        } else {
          face = FightDiceFaces.Hit;
        }
        results.push(face);
      }
      io.to(gameId).emit("dice-update", {
        listResults: results,
        role: playerRole,
      });

      await sleep(75);
    }
    return { success: true, results: results };
  }

  async rollRedDice(
    gameId: string,
    numberOfDices: number,
    playerRole: PlayerRole,
  ): Promise<{ success: boolean; results?: number[]; error?: string }> {
    const io = ServerHeroQuest.getServerInstance().getIo();

    let results: number[] = [];
    for (let j = 0; j < 15; j++) {
      results = [];
      for (let i = 0; i < numberOfDices; i++) {
        const randomNumber = Math.floor(Math.random() * 6 + 1);
        results.push(randomNumber);
      }
      io.to(gameId).emit("red-dice-update", {
        listResults: results,
        role: playerRole,
      });
      await sleep(75);
    }
    return { success: true, results: results };
  }
}

export async function grantSpecialRollAuthorization(
  game: Game,
  numberOfDices: number,
  typeOfDices: "fight" | "red",
  playerId: HeroCategory | string, // can be playerId or heroClass
) {
  const io = ServerHeroQuest.getServerInstance().getIo();
  let hero;
  if (typeof playerId !== "string") {
    hero = game.gameState.getHeroByCategory(playerId);
  } else {
    hero = game.gameState.getHeroById(playerId);
  }

  if (!hero) {
    console.error("hero couldn't be found for special dice authorization");
    return {
      success: false,
      error:
        "le héros n'a pas pu être trouvé pour l'autorisation spéciale de lancer des dés",
    };
  }

  const specialAuthorizedHero: SpecialAuthorizedHero = {
    heroId: hero.id,
    numberOfDices,
    diceType: typeOfDices,
  };
  game.gameState.setSpecialAuthorizedHero(specialAuthorizedHero);

  io.to(game.id).emit("special-authorization", {
    playerId: hero.controlledByPlayerId,
    amountOfDices: numberOfDices,
    typeOfDices: typeOfDices,
  });

  return { success: true };
}