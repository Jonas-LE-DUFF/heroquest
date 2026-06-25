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
} from "../validation";
import { DiceServiceRegistry } from "../services/DiceServiceRegistry";
import { grantSpecialRollAuthorization } from "../services/DiceService";

export function registerDiceHandlers(socket: Socket) {
  handleSpecialRollAuthorization(socket);
  handleRollRedDice(socket);
  handleRollFightDice(socket);
}

function handleSpecialRollAuthorization(socket: Socket) {
  socket.on(
    "authorize-special-throw-dices",
    withValidation(
      socket,
      authorizeSpecialThrowSchema,
      (socket, data, callback) => {
        const { gameId, playerId, numberOfDices, typeOfDices, playerClass } = data;
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
    withValidation(
      socket,
      rollRedDiceSchema,
      async (socket, data, callback) => {
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

        let amountOfDice;

        const player = game!.getPlayer(playerId);
        if (!player) {
          console.error("no player found for rolling fight dices");
          return callback(
            errorResponse("le joueur lançant les dés n'a pas pu être trouvé"),
          );
        }

        const specialAuthorization = game?.gameState.getSpecialAuthorizedHero();
        if (player.role === PlayerRole.GAME_MASTER) {
          amountOfDice = numberOfDice;
          const dice = DiceServiceRegistry.get();
          const result = await dice.rollRedDice(
            gameId,
            amountOfDice,
            player.role,
          );
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
          amountOfDice = specialAuthorization.numberOfDices;
          game!.gameState.setSpecialAuthorizedHero(undefined);
        } else if (player.role === PlayerRole.HERO) {
          try {
            const hero = game!.getCurrentHeroTurn();
            amountOfDice = hero.getMovementPoints();
          } catch (error) {
            if (error instanceof Error) {
              console.error("error while getting current hero turn:", error.message);
              return callback(errorResponse(error.message || "erreur interne"));
            }
            console.error("unexpected error while getting current hero turn");
            return callback(
              errorResponse("unexpected error while getting current hero turn"),
            );
          }
        } else {
          amountOfDice = numberOfDice;
        }

        const dice = DiceServiceRegistry.get();
        const result = await dice.rollRedDice(gameId, amountOfDice, player.role);
        callback(result);
      },
    ),
  );
}

function handleRollFightDice(socket: Socket) {
  socket.on(
    "roll-dice",
    withValidation(socket, rollDiceSchema, async (socket, data, callback) => {
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

      let amountOfDice;

      const player = game!.getPlayer(playerId);
      if (!player) {
        console.error("no player found for rolling fight dices");
        return callback(
          errorResponse("le joueur lançant les dés n'a pas pu être trouvé"),
        );
      }

      const specialAuthorization = game?.gameState.getSpecialAuthorizedHero();
      if (player.role === PlayerRole.GAME_MASTER) {
        amountOfDice = numberOfDice;
        const dice = DiceServiceRegistry.get();
        const result = await dice.rollFightDice(gameId, amountOfDice, player.role);
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
        amountOfDice = specialAuthorization.numberOfDices;
        game!.gameState.setSpecialAuthorizedHero(undefined);
      } else if (player.role === PlayerRole.HERO) {
        try {
          const hero = game!.getCurrentHeroTurn();
          amountOfDice = hero.getAttackDiceCount();
        } catch (error) {
          if (error instanceof Error) {
            console.error("error while getting current hero turn:", error.message);
            return callback(errorResponse(error.message || "erreur interne"));
          }
          console.error("unexpected error while getting current hero turn");
          return callback(
            errorResponse("unexpected error while getting current hero turn"),
          );
        }
      } else {
        amountOfDice = numberOfDice;
      }

      const dice = DiceServiceRegistry.get();
      const result = await dice.rollFightDice(gameId, amountOfDice, player.role);
      callback(result);
    }),
  );
}
