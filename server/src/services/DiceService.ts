import { Server, Socket } from "socket.io";
import { ClientToServerEvents } from "../POO/interfaces/Events/ClientToServerEvents";
import { ServerToClientEvents } from "../POO/interfaces/Events/ServerToClientEvents";
import { SocketData } from "../POO/interfaces/Socket/SocketData";
import { Game } from "../POO/classes/Server/Game";
import { FightDiceFaces } from "../POO/enums/Dices/FightDiceFaces";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";

interface SpecialAuthorizedPlayer {
  playerId: string;
  numberOfDices: number;
  diceType: "red" | "fight";
}
let specialAuthorizedPlayer: SpecialAuthorizedPlayer | undefined = undefined;

const sleep = (ms: number) => {
  return new Promise((r) => setTimeout(r, ms));
};

export async function rollFightDice(
  io: Server<ClientToServerEvents, ServerToClientEvents, SocketData>,
  playerId: string,
  game: Game,
  wishedNumberOfDices: number
) {
  console.log("roll-dice");
  let numberOfDices: number | undefined;

  const playerRole = game.players.get(playerId)?.role;
  if (!playerRole) {
    console.error("player role couldn't be found");
    return {
      success: false,
      error: "aucun rôle trouvé pour le joueur lançant les dés de combat",
    };
  }

  if (playerRole === "game-master") {
    // if player is game-master he can choose the amount of dices
    numberOfDices = wishedNumberOfDices;
  } else if (
    specialAuthorizedPlayer &&
    specialAuthorizedPlayer.playerId === playerId &&
    specialAuthorizedPlayer.diceType === "fight"
  ) {
    // if player is specialy authorized to roll fight dices
    console.log("using special authorized dices");
    numberOfDices = specialAuthorizedPlayer.numberOfDices;
    specialAuthorizedPlayer = undefined;
  } else {
    numberOfDices = game.getCurrentHeroTurn().getAttackDiceCount();
  }

  if (numberOfDices === undefined) {
    console.log("no amount of dice to throw defined");
    return {
      success: false,
      error: "pas de nombre de dés à lancer défini",
    };
  }

  let results: FightDiceFaces[] = [];
  for (let j = 0; j < 15; j++) {
    results = [];
    for (let i = 0; i < numberOfDices; i++) {
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
    io.to(game.id).emit("dice-update", {
      listResults: results,
      role: playerRole,
    });

    await sleep(75);
  }
  return { success: true, results: results };
}

export async function rollRedDice(
  io: Server<ClientToServerEvents, ServerToClientEvents, SocketData>,
  playerId: string,
  game: Game,
  wishedNumberOfDices: number
) {
  console.log("roll-red-dice");
  let numberOfDices: number = 2; // default number of dices

  // checking if data needed exists
  if (!game) {
    console.error("game couldn't be found");
    return {
      success: false,
      error: "la partie n'a pas pu être trouvée",
    };
  }
  const player = game.players.get(playerId);
  if (!player) {
    console.error("no player found for rolling red dices");
    return {
      success: false,
      error: "le joueur lançant les dés rouges n'a pas pu être trouvé",
    };
  }
  const playerRole = player.role;
  if (!playerRole) {
    console.error("no role found for player rolling red dices");
    return {
      success: false,
      error: "aucun rôle trouvé pour le joueur lançant les dés rouges",
    };
  }

  if (
    wishedNumberOfDices !== undefined &&
    wishedNumberOfDices > 0 &&
    playerRole === "game-master" // if player is game-master he can choose the amount of dices
  ) {
    numberOfDices = wishedNumberOfDices;
  } else if (
    specialAuthorizedPlayer &&
    specialAuthorizedPlayer.playerId === playerId &&
    specialAuthorizedPlayer.diceType === "red"
    // if player is specialy authorized to roll red dices
  ) {
    numberOfDices = specialAuthorizedPlayer.numberOfDices;
    specialAuthorizedPlayer = undefined;
  } else {
    const hero = game.gameState.getHeroById(playerId);
    if (!hero) {
      console.error("hero couldn't be found for red dice roll");
      return {
        success: false,
        error: "le héros du joueur lançant les dés rouges n'a pas pu être trouvé",
      };
    }
    numberOfDices = hero.stats.movements;
  }


  let results: number[] = [];
  for (let j = 0; j < 15; j++) {
    results = [];
    for (let i = 0; i < numberOfDices; i++) {
      const randomNumber = Math.floor(Math.random() * 6 + 1);
      results.push(randomNumber);
    }
    io.to(game.id).emit("red-dice-update", {
      listResults: results,
      role: playerRole,
    });
    await sleep(75);
  }
  return { success: true, results: results };
}

export async function grantSpecialRollAuthorization(
  game: Game,
  socket: Socket<ClientToServerEvents, ServerToClientEvents, SocketData, any>,
  numberOfDices: number,
  typeOfDices: "fight" | "red",
  playerId: HeroCategory | string // can be playerId or heroClass
) {
  if (typeof playerId !== "string") {
    playerId = game.gameState.getHeroByCategory(playerId).id;
  }

  const player = game.players.get(playerId);

  if (!player) {
    console.error("player couldn't be found");
    return {
      success: false,
      error: "le joueur n'a pas pu être trouvé",
    };
  }

  specialAuthorizedPlayer = {
    playerId,
    numberOfDices,
    diceType: typeOfDices,
  };

  socket.to(game.id).emit("special-authorization", {
    playerId,
    amountOfDices: numberOfDices,
    typeOfDices: typeOfDices,
  });

  return { success: true };
}
