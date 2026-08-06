import { Game } from "../POO/classes/Server/Game";
import { FightDiceFaces } from "../POO/enums/Dices/FightDiceFaces";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { SpecialAuthorizedHero } from "../POO/interfaces/SpecialAuthorizedHero";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { IDiceService, RollProps } from "../POO/interfaces/IClass/IDiceService";
import { Socket } from "socket.io";
import { logger } from "../utils/logger";

type PendingRollEntry = {
  results: number[];
  diceType: "fight" | "red";
  expiresAt: number; // pour éviter les fuites mémoire
  callback: (results: FightDiceFaces[] | number[]) => void;
};
type PendingRoll = Map<string, PendingRollEntry>; // clé: playerId, valeur: PendingRollEntry

export class DiceService implements IDiceService {
  private pendingRollsGames = new Map<string, PendingRoll>();

  rollDice(rollProps: RollProps): {
    success: boolean;
    results?: FightDiceFaces[];
    error?: string;
  } {
    const { gameId, wishedNumberOfDices, playerId, kind, callback } = rollProps;
    const socket = findSocketByPlayerId(gameId, playerId);
    if (!socket) {
      logger.error("No socket found for player:", playerId);
      return { success: false, error: "No socket found for player" };
    }
    let results: FightDiceFaces[] | number[] = [];
    if (kind === "fight") {
      results = [];
      for (let i = 0; i < wishedNumberOfDices; i++) {
        const randomNumber = Math.floor(Math.random() * 6 + 1);
        let face: FightDiceFaces = FightDiceFaces.Hit;
        if (randomNumber === 1) {
          face = FightDiceFaces.BlackShield;
        } else if (randomNumber <= 3) {
          face = FightDiceFaces.WhiteShield;
        } else {
          face = FightDiceFaces.Hit;
        }
        results.push(face);
      }
    } else /*if (kind === "red")*/ {
      for (let i = 0; i < wishedNumberOfDices; i++) {
        const randomNumber = Math.floor(Math.random() * 6 + 1);
        results.push(randomNumber);
      }
    }

    const pendingRolls =
      this.pendingRollsGames.get(gameId) || new Map<string, PendingRollEntry>();
    pendingRolls.set(playerId, {
      results,
      diceType: kind,
      expiresAt: Date.now() + 30_000, // expire après 30s
      callback,
    });
    this.pendingRollsGames.set(gameId, pendingRolls);

    socket.emit("request-dice-vector", {
      typeOfDices: kind,
    });

    return { success: true };
  }

  resolveWithVector(
    gameId: string,
    playerId: string,
    vector: { x: number; y: number; z: number; boost: number },
  ): { success: boolean; error?: string } {
    const io = ServerHeroQuest.getServerInstance().getIo();
    const pendingRolls = this.pendingRollsGames.get(gameId);
    const pending = pendingRolls?.get(playerId);

    if (!pending) {
      logger.error("No pending roll for game", gameId);
      return { success: false, error: "No pending roll for game" };
    }

    // Expire ?
    if (Date.now() > pending.expiresAt) {
      pendingRolls?.delete(playerId);
      // Génère un vecteur aléatoire si le joueur a mis trop longtemps
      vector = {
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random() * 2 - 1,
        boost: Math.random() * 500 + 300,
      };
    } else {
      pending.callback(pending.results);
    }

    pendingRolls?.delete(playerId);

    const playerRole = ServerHeroQuest.getServerInstance()
      .getGame(gameId)!
      .getPlayer(playerId)!.role;

    logger.info("Emitting dice-update with results:", pending.results);
    io.to(gameId).emit("dice-update", {
      listResults: pending.results,
      role: playerRole,
      vector,
      kind: pending.diceType,
    });

    return { success: true };
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
    logger.error("hero couldn't be found for special dice authorization");
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

  logger.info(
    "grantSpecialRollAuthorization: emitting special-authorization for hero:",
    {
      heroId: hero.id,
      numberOfDices,
      typeOfDices,
    },
  );

  io.to(game.id).emit("special-authorization", {
    playerId: hero.controlledByPlayerId,
    amountOfDices: numberOfDices,
    typeOfDices: typeOfDices,
  });

  return { success: true };
}

function findSocketByPlayerId(
  gameId: string,
  playerId: string,
): Socket | undefined {
  const server = ServerHeroQuest.getServerInstance();
  const io = server.getIo();
  const socketId = server.getGame(gameId)?.getPlayer(playerId)?.socketId;
  return socketId ? io.sockets.sockets.get(socketId) : undefined;
}
