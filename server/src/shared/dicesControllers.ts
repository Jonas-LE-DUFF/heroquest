import { Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  diceFace,
  GameState,
  heroClass,
  ServerToClientEvents,
  SocketData,
} from "./type";
import { getAmountOfDices } from "./util";

interface SpecialAuthorizedPlayer {
  playerId: string;
  numberOfDices: number;
  diceType: "red" | "fight";
}
let specialAuthorizedPlayer: SpecialAuthorizedPlayer | undefined = undefined;

const sleep = (ms: number) => {
  return new Promise((r) => setTimeout(r, ms));
};

function handleRollFightDice(
  io: Server<ClientToServerEvents, ServerToClientEvents, SocketData>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents, SocketData, any>,
  games: Map<string, GameState>
) {
  socket.on(
    "roll-dice",
    async (
      data: {
        gameId: string;
        playerId: string;
        numberOfDice: number;
      },
      callback: (response: { success: boolean; error?: string }) => void
    ) => {
      const gameState = games.get(data.gameId);
      let numberOfDices: number | undefined;

      // checking if data needed exists
      if (!gameState) {
        console.error("game couldn't be found");
        return callback({
          success: false,
          error: "la partie n'a pas pu être trouvée",
        });
      }
      const playerRole = gameState.players.get(data.playerId)?.role;
      if (!playerRole) {
        console.error("player role couldn't be found");
        return callback({
          success: false,
          error: "aucun rôle trouvé pour le joueur lançant les dés de combat",
        });
      }

      if (playerRole === "game-master") {
        // if player is game-master he can choose the amount of dices
        numberOfDices = data.numberOfDice;
      } else if (
        specialAuthorizedPlayer &&
        specialAuthorizedPlayer.playerId === data.playerId &&
        specialAuthorizedPlayer.diceType === "fight"
      ) {
        // if player is specialy authorized to roll fight dices
        console.log("using special authorized dices");
        numberOfDices = specialAuthorizedPlayer.numberOfDices;
        specialAuthorizedPlayer = undefined;
      } else if (gameState.currentTurn !== socket.id) {
        // checking if it's the player's turn
        console.error("not your turn to roll red dices");
        return callback({
          success: false,
          error: "Attends ton tour trou du q !",
        });
      } else {
        // taking the amount of dices from the player's stats

        numberOfDices = getAmountOfDices(
          gameState,
          data.playerId,
          "att" //TODO : need to know if we attack or defend !!
        );
      }

      if (numberOfDices === undefined) {
        console.log("no amount of dice to throw defined");
        return callback({
          success: false,
          error: "pas de nombre de dés à lancer défini",
        });
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
        io.to(data.gameId).emit("dice-update", {
          listResults: results,
          role: playerRole,
        });

        await sleep(75);
        results = [];
      }
      return callback({ success: true });
    }
  );
}

function handleRollRedDice(
  io: Server<ClientToServerEvents, ServerToClientEvents, SocketData>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents, SocketData, any>,
  games: Map<string, GameState>
) {
  socket.on(
    "roll-red-dice",
    async (
      data: { gameId: string; currentNumberOfDices: number },
      callback
    ) => {
      const result = await rollRedDice(
        io,
        socket.id,
        games.get(data.gameId)!,
        data.currentNumberOfDices
      );
      return callback(result);
    }
  );
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

function handleSpecialRollAuthorization(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, SocketData, any>,
  games: Map<string, GameState>
) {
  socket.on(
    "authorize-special-throw-dices",
    (data: {
      gameId: string;
      numberOfDices: number;
      typeOfDices: "fight" | "red";
      playerClass: heroClass;
    }) => {
      console.log("authorizing special throw dices");
      const { gameId, numberOfDices, typeOfDices, playerClass } = data;
      const game = games.get(gameId);
      if (!game) {
        console.error("game couldn't be found");
        return;
      }
      const playerIds = game.players.keys();
      let playerId: string | undefined = playerIds.next().value;

      while (playerId !== undefined) {
        if (game.players.get(playerId)?.class === playerClass) {
          break;
        }
        playerId = playerIds.next().value;
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

      socket.to(gameId).emit("special-authorization", {
        playerId,
        amountOfDices: numberOfDices,
        typeOfDices: typeOfDices,
      });
    }
  );
}
export {
  handleRollFightDice,
  handleRollRedDice,
  handleSpecialRollAuthorization,
};
