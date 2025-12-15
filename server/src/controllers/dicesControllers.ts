import { Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  diceFace,
  GameState,
  heroClass,
  ServerToClientEvents,
  SocketData,
} from "../shared/type";
import { getAmountOfDices, getPlayerByClass } from "../shared/util";

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
  gameState: GameState,
  wishedNumberOfDices: number
) {
  console.log("roll-dice");
  let numberOfDices: number | undefined;

  // checking if data needed exists
  if (!gameState) {
    console.error("game couldn't be found");
    return {
      success: false,
      error: "la partie n'a pas pu être trouvée",
    };
  }
  const playerRole = gameState.players.get(playerId)?.role;
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
  } else if (gameState.currentTurn !== playerId) {
    // checking if it's the player's turn
    console.error("not your turn to roll red dices");
    return {
      success: false,
      error: "Attends ton tour trou du q !",
    };
  } else {
    // taking the amount of dices from the player's stats

    numberOfDices = getAmountOfDices(
      gameState,
      playerId,
      "att" //TODO : need to know if we attack or defend !!
    );
  }

  if (numberOfDices === undefined) {
    console.log("no amount of dice to throw defined");
    return {
      success: false,
      error: "pas de nombre de dés à lancer défini",
    };
  }

  for (let j = 0; j < 15; j++) {
    let results: diceFace[] = [];
    for (let i = 0; i < numberOfDices; i++) {
      const randomNumber = Math.floor(Math.random() * 6 + 1);
      let face: diceFace = diceFace.Hit;
      if (randomNumber === 1) {
        face = diceFace.BlackShield;
      } else if (randomNumber < 3) {
        face = diceFace.WhiteShield;
      } else {
        face = diceFace.Hit;
      }
      results.push(face);
    }
    io.to(gameState.id).emit("dice-update", {
      listResults: results,
      role: playerRole,
    });

    await sleep(75);
    results = [];
  }
  return { success: true };
}

export async function rollRedDice(
  io: Server<ClientToServerEvents, ServerToClientEvents, SocketData>,
  playerId: string,
  gameState: GameState,
  wishedNumberOfDices: number
) {
  console.log("roll-red-dice");
  let numberOfDices: number = 2; // default number of dices

  // checking if data needed exists
  if (!gameState) {
    console.error("game couldn't be found");
    return {
      success: false,
      error: "la partie n'a pas pu être trouvée",
    };
  }
  const playerRole = gameState.players.get(playerId)?.role;
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
  } else if (gameState.currentTurn !== playerId) {
    // checking if it's the player's turn
    console.error("not your turn to roll red dices");
    return {
      success: false,
      error: "Attends ton tour trou du q !",
    };
  }

  let results: number[] = [];
  for (let j = 0; j < 15; j++) {
    results = [];
    for (let i = 0; i < numberOfDices; i++) {
      const randomNumber = Math.floor(Math.random() * 6 + 1);
      results.push(randomNumber);
    }
    io.to(gameState.id).emit("red-dice-update", {
      listResults: results,
      role: playerRole,
    });
    await sleep(75);
  }
  return { success: true, results: results };
}

export async function grantSpecialRollAuthorization(
  game: GameState | undefined,
  socket: Socket<ClientToServerEvents, ServerToClientEvents, SocketData, any>,
  numberOfDices: number,
  typeOfDices: "fight" | "red",
  playerId: heroClass | string // can be playerId or heroClass
) {
  if (!game) {
    console.error("game couldn't be found");
    return;
  }

  if (typeof playerId !== "string") {
    const playerIds = getPlayerByClass(game, playerId);
    if (!playerIds) {
      console.error("player couldn't be found");
      return;
    }
    playerId = playerIds;
  }

  if (!playerId) {
    console.error("player couldn't be found");
    return;
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
}
