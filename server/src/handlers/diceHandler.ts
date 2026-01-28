import { Socket } from "socket.io";
import {
    grantSpecialRollAuthorization,
    rollFightDice,
    rollRedDice,
} from "../services/DiceService";
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

export function registerDiceHandlers(socket: Socket) {
    handleSpecialRollAuthorization(socket);
    handleRollRedDice(socket);
    handleRollFightDice(socket);
}

function handleSpecialRollAuthorization(socket: Socket) {
    socket.on(
        "authorize-special-throw-dices",
        withValidation(
            authorizeSpecialThrowSchema,
            (socket, data, callback) => {
                const { gameId, numberOfDices, typeOfDices, playerClass } = data;
                const gameState = GameService.getGame(gameId);

                if (!requireGameExists(gameId)) {
                    return callback(errorResponse("Partie non trouvée"));
                }

                if (!requireGameMaster(socket, gameState!)) {
                    return callback(
                        errorResponse("Vous n'êtes pas le maître du jeu"),
                    );
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
        withValidation(rollRedDiceSchema, async (socket, data, callback) => {
            const { gameId, numberOfDice } = data;
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

            const player = game!.getPlayer(socket.data.playerId);
            if (!player) {
                console.error("no player found for rolling fight dices");
                return callback(
                    errorResponse(
                        "le joueur lançant les dés n'a pas pu être trouvé",
                    ),
                );
            }

            const specialAuthorizedHero =
                game?.gameState.getSpecialAuthorizedHero();
            const hero = game?.getCurrentHeroTurn();
            if (
                specialAuthorizedHero &&
                specialAuthorizedHero.heroId === hero?.id &&
                specialAuthorizedHero.diceType === "fight"
            ) {
                amountOfDice = specialAuthorizedHero.numberOfDices;
                game!.gameState.setSpecialAuthorizedHero(undefined);
            } else if (player.role === PlayerRole.HERO) {
                try {
                    const hero = game!.getCurrentHeroTurn();
                    amountOfDice = hero.getAttackDiceCount();
                } catch (error) {
                    console.error(
                        "error while getting current hero turn:",
                        error,
                    );
                    return callback(errorResponse("erreur interne"));
                }
            } else {
                amountOfDice = numberOfDice;
            }

            const result = await rollRedDice(gameId, amountOfDice, player.role);
            callback(result);
        }),
    );
}

function handleRollFightDice(socket: Socket) {
    socket.on(
        "roll-dice",
        withValidation(rollDiceSchema, async (socket, data, callback) => {
            const { gameId, numberOfDice } = data;
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

            const player = game!.getPlayer(socket.data.playerId);
            if (!player) {
                console.error("no player found for rolling fight dices");
                return callback(
                    errorResponse(
                        "le joueur lançant les dés n'a pas pu être trouvé",
                    ),
                );
            }

            const specialAuthorizedHero =
                game?.gameState.getSpecialAuthorizedHero();
            const hero = game?.getCurrentHeroTurn();
            if (
                specialAuthorizedHero &&
                specialAuthorizedHero.heroId === hero?.id &&
                specialAuthorizedHero.diceType === "fight"
            ) {
                amountOfDice = specialAuthorizedHero.numberOfDices;
                game!.gameState.setSpecialAuthorizedHero(undefined);
            } else if (player.role === PlayerRole.HERO) {
                try {
                    const hero = game!.getCurrentHeroTurn();
                    amountOfDice = hero.getAttackDiceCount();
                } catch (error) {
                    console.error(
                        "error while getting current hero turn:",
                        error,
                    );
                    return callback(errorResponse("erreur interne"));
                }
            } else {
                amountOfDice = numberOfDice;
            }

            const result = await rollFightDice(
                gameId,
                amountOfDice,
                player.role,
            );
            callback(result);
        }),
    );
}
