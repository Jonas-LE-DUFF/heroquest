import { Game } from "../POO/classes/Server/Game";
import { FightDiceFaces } from "../POO/enums/Dices/FightDiceFaces";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { SpecialAuthorizedHero } from "../POO/interfaces/SpecialAuthorizedHero";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { IDiceService } from "../POO/interfaces/IClass/IDiceService";

export class DiceService implements IDiceService {
  rollFightDice(
    gameId: string,
    wishedNumberOfDices: number,
    playerRole: PlayerRole,
  ): { success: boolean; results?: FightDiceFaces[]; error?: string } {
    const io = ServerHeroQuest.getServerInstance().getIo();

    let results: FightDiceFaces[] = [];
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

    console.log("rollFightDice results:", results);

    io.to(gameId).emit("dice-update", {
      listResults: results,
      role: playerRole,
    });

    return { success: true, results: results };
  }

  rollRedDice(
    gameId: string,
    numberOfDices: number,
    playerRole: PlayerRole,
  ): { success: boolean; results?: number[]; error?: string } {
    const io = ServerHeroQuest.getServerInstance().getIo();

    let results: number[] = [];
    results = [];
    for (let i = 0; i < numberOfDices; i++) {
      const randomNumber = Math.floor(Math.random() * 6 + 1);
      results.push(randomNumber);
    }
    console.log("rollRedDice results:", results);
    io.to(gameId).emit("red-dice-update", {
      listResults: results,
      role: playerRole,
    });
    return { success: true, results: results };
  }
}

export function grantSpecialRollAuthorization(
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
