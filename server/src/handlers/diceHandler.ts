import { Socket } from "socket.io";
import { requireGameMaster } from "../guards/requireGameMaster";
import { requireGameExists } from "../guards/requireGameExists";
import { GameService } from "../services/GameService";
import { PlayerRole } from "../POO/enums/PlayerRole";
import {
  withValidation,
  successResponse,
  errorResponse,
  authorizeSpecialThrowSchema,
  rollRedDiceSchema,
  rollDiceSchema,
  provideRollVectorSchema,
} from "../validation";
import { DiceServiceRegistry } from "../services/DiceServiceRegistry";
import { grantSpecialRollAuthorization } from "../services/DiceService";
import { RollProps } from "../POO/interfaces/IClass/IDiceService";

export function registerDiceHandlers(socket: Socket) {
  handleSpecialRollAuthorization(socket);
  handleRollRedDice(socket);
  handleRollFightDice(socket);
  handleProvideRollVector(socket);
}

function handleSpecialRollAuthorization(socket: Socket) {
  socket.on(
    "authorize-special-throw-dices",
    withValidation(
      socket,
      authorizeSpecialThrowSchema,
      (socket, data, callback) => {
        const { gameId, playerId, numberOfDices, typeOfDices, playerClass } =
          data;
        const gameState = GameService.getGame(gameId);

        if (!requireGameExists(gameId)) {
          return callback(errorResponse("Partie non trouvée"));
        }

        if (!requireGameMaster(playerId, gameState!)) {
          return callback(errorResponse("Vous n'êtes pas le maître du jeu"));
        }

        grantSpecialRollAuthorization(
          gameState!,
          numberOfDices,
          typeOfDices,
          playerClass,
        );

        callback(successResponse());
      },
    ),
  );
}

function handleRollRedDice(socket: Socket) {
  socket.on(
    "roll-red-dice",
    withValidation(socket, rollRedDiceSchema, (socket, data, callback) => {
      const { gameId, playerId, numberOfDice } = data;
      const game = GameService.getGame(gameId);

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Partie non trouvée"));
      }

      if (numberOfDice <= 0) {
        return callback(
          errorResponse("Number of dice must be greater than zero."),
        );
      }

      let wishedNumberOfDices;

      const player = game!.getPlayer(playerId);
      if (!player) {
        console.error("no player found for rolling fight dices");
        return callback(
          errorResponse("le joueur lançant les dés n'a pas pu être trouvé"),
        );
      }

      const specialAuthorization = game?.gameState.getSpecialAuthorizedHero();
      if (player.role === PlayerRole.GAME_MASTER) {
        wishedNumberOfDices = numberOfDice;
        const dice = DiceServiceRegistry.get();
        const result = dice.rollRedDice({
          gameId,
          wishedNumberOfDices,
          playerId,
        } as RollProps);
        return callback(result);
      }
      const authorizedHero = game?.gameState.getHeroById(
        specialAuthorization?.heroId || "",
      );
      if (
        specialAuthorization &&
        authorizedHero?.controlledByPlayerId === player.id &&
        specialAuthorization.diceType === "red"
      ) {
        wishedNumberOfDices = specialAuthorization.numberOfDices;
        game!.gameState.setSpecialAuthorizedHero(undefined);
      } else if (player.role === PlayerRole.HERO) {
        try {
          const hero = game!.getCurrentHeroTurn();
          wishedNumberOfDices = hero.getMovementPoints();
        } catch (error) {
          if (error instanceof Error) {
            console.error(
              "error while getting current hero turn:",
              error.message,
            );
            return callback(errorResponse(error.message || "erreur interne"));
          }
          console.error("unexpected error while getting current hero turn");
          return callback(
            errorResponse("unexpected error while getting current hero turn"),
          );
        }
      } else {
        wishedNumberOfDices = numberOfDice;
      }

      const dice = DiceServiceRegistry.get();
      const result = dice.rollRedDice({
        gameId,
        wishedNumberOfDices,
        playerId,
      } as RollProps);
      callback(result);
    }),
  );
}

function handleRollFightDice(socket: Socket) {
  socket.on(
    "roll-dice",
    withValidation(socket, rollDiceSchema, (socket, data, callback) => {
      const { gameId, playerId, numberOfDice } = data;
      const game = GameService.getGame(gameId);

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Partie non trouvée"));
      }

      if (numberOfDice <= 0) {
        return callback(
          errorResponse("Number of dice must be greater than zero."),
        );
      }

      let wishedNumberOfDices;

      const player = game!.getPlayer(playerId);
      if (!player) {
        console.error("no player found for rolling fight dices");
        return callback(
          errorResponse("le joueur lançant les dés n'a pas pu être trouvé"),
        );
      }

      const specialAuthorization = game?.gameState.getSpecialAuthorizedHero();
      if (player.role === PlayerRole.GAME_MASTER) {
        wishedNumberOfDices = numberOfDice;
        const dice = DiceServiceRegistry.get();
        const result = dice.rollFightDice({
          gameId,
          wishedNumberOfDices,
          playerId,
        });
        return callback(result);
      }

      const authorizedHero = game?.gameState.getHeroById(
        specialAuthorization?.heroId || "",
      );
      if (
        specialAuthorization &&
        authorizedHero?.controlledByPlayerId === player.id &&
        specialAuthorization.diceType === "fight"
      ) {
        wishedNumberOfDices = specialAuthorization.numberOfDices;
        game!.gameState.setSpecialAuthorizedHero(undefined);
      } else if (player.role === PlayerRole.HERO) {
        try {
          const hero = game!.getCurrentHeroTurn();
          wishedNumberOfDices = hero.getAttackDiceCount();
        } catch (error) {
          if (error instanceof Error) {
            console.error(
              "error while getting current hero turn:",
              error.message,
            );
            return callback(errorResponse(error.message || "erreur interne"));
          }
          console.error("unexpected error while getting current hero turn");
          return callback(
            errorResponse("unexpected error while getting current hero turn"),
          );
        }
      } else {
        wishedNumberOfDices = numberOfDice;
      }

      const dice = DiceServiceRegistry.get();
      const result = dice.rollFightDice({
        gameId,
        wishedNumberOfDices,
        playerId,
      });
      callback(result);
    }),
  );
}

function handleProvideRollVector(socket: Socket) {
  socket.on(
    "provide-roll-vector",
    withValidation(
      socket,
      provideRollVectorSchema,
      (socket, data, callback) => {
        const { gameId, vector, boost } = data;
        const dice = DiceServiceRegistry.get();
        const vectorWithBoost = { ...vector, boost };
        console.log("Received roll vector from client:", vectorWithBoost);
        dice.resolveWithVector(gameId, vectorWithBoost);
        callback({ success: true });
      },
    ),
  );
}
