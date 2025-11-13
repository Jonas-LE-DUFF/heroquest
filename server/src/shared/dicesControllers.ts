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
function handleRollFightDice(
  io: Server<ClientToServerEvents, ServerToClientEvents, SocketData>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents, SocketData, any>,
  games: Map<string, GameState>,
  sleep: (ms: number) => Promise<unknown>
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
      console.log("roll-dice");

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
        console.log("using dice stats");

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
      console.log("sending");

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
  games: Map<string, GameState>,
  sleep: (ms: number) => Promise<unknown>
) {
  socket.on(
    "roll-red-dice",
    async (
      data: { gameId: string; currentNumberOfDices: number },
      callback
    ) => {
      console.log("roll-red-dice");
      let numberOfDices: number = 2; // default number of dices
      const gameState = games.get(data.gameId);

      // checking if data needed exists
      if (!gameState) {
        console.error("game couldn't be found");
        return callback({
          success: false,
          error: "la partie n'a pas pu être trouvée",
        });
      }
      const playerRole = gameState.players.get(socket.id)?.role;
      if (!playerRole) {
        console.error("no role found for player rolling red dices");
        return callback({
          success: false,
          error: "aucun rôle trouvé pour le joueur lançant les dés rouges",
        });
      }

      if (
        data.currentNumberOfDices !== undefined &&
        data.currentNumberOfDices > 0 &&
        playerRole === "game-master" // if player is game-master he can choose the amount of dices
      ) {
        numberOfDices = data.currentNumberOfDices;
      } else if (
        specialAuthorizedPlayer &&
        specialAuthorizedPlayer.playerId === socket.id &&
        specialAuthorizedPlayer.diceType === "red"
        // if player is specialy authorized to roll red dices
      ) {
        numberOfDices = specialAuthorizedPlayer.numberOfDices;
        specialAuthorizedPlayer = undefined;
      } else if (gameState.currentTurn !== socket.id) {
        // checking if it's the player's turn
        console.error("not your turn to roll red dices");
        return callback({
          success: false,
          error: "Attends ton tour trou du q !",
        });
      }

      for (let j = 0; j < 15; j++) {
        let results: number[] = [];
        for (let i = 0; i < numberOfDices; i++) {
          const randomNumber = Math.floor(Math.random() * 6 + 1);
          results.push(randomNumber);
        }
        io.to(data.gameId).emit("red-dice-update", {
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

function handleSpecialRollAuth(
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
      console.log("start ID", playerId);

      while (playerId !== undefined) {
        if (game.players.get(playerId)?.class === playerClass) {
          break;
        }
        playerId = playerIds.next().value;
        console.log("searching player for special dice authorization");
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
      console.log(specialAuthorizedPlayer);

      console.log("emitting special-authorization to player :", playerId);
      socket.to(gameId).emit("special-authorization", {
        playerId,
        amountOfDices: numberOfDices,
        typeOfDices: typeOfDices,
      });
    }
  );
}
export { handleRollFightDice, handleRollRedDice, handleSpecialRollAuth };
