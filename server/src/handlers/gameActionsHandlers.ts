import { Socket } from "socket.io";
import { requireGameExists } from "../guards/requireGameExists";
import { requirePlayerTurn } from "../guards/requirePlayerTurn";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { fight } from "../services/CombatService";
import { emitGameStateUpdate, getGameMasterSocket } from "../utils/gameStateEmitter";
import { GameService } from "../services/GameService";
import {
  withValidation,
  successResponse,
  errorResponse,
  toPosition,
  castSpellSchema,
  attackSchema,
  drinkPotionSchema,
  heroActionSchema,
} from "../validation";
import { TreasureCardDeckHandler } from "../POO/classes/Treasures/TreasureCardDeck";
import { requireGameMaster } from "../guards/requireGameMaster";

export function registerGameActionsHandlers(socket: Socket) {
  ///** common player and game master actions **///

  // cast-spell
  socket.on(
    "cast-spell",
    withValidation(socket, castSpellSchema, async (socket, data, callback) => {
      console.debug("casting spell", data);
      const { gameId, spellId, position } = data;
      const game = GameService.getGame(gameId);

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("game couldn't be found in cast-spell"));
      }

      if (!requirePlayerTurn(socket, game!)) {
        return callback(
          errorResponse("it's not your turn to play in cast-spell"),
        );
      }

      try {
        const castingPlayer = game!.getCurrentPlayerTurn();
        console.debug("spell cast by player", castingPlayer?.name);
      } catch (error) {
        return callback(
          errorResponse(
            "player casting spell couldn't be found : " +
              (error as Error).message,
          ),
        );
      }

      const heroCaster = game!.getCurrentHeroTurn();
      const spellToCast = heroCaster.getSpellById(spellId);
      const targetUnit = game!
        .getGameState()
        .getUnitByPosition(toPosition(position));

      if (!spellToCast || !targetUnit) {
        return callback(errorResponse("spell or target unit not found"));
      }

      await heroCaster.castSpell(spellToCast, targetUnit);

      const io = ServerHeroQuest.getServerInstance().getIo();

      emitGameStateUpdate(io, gameId, game!);

      callback(successResponse());
    }),
  );

  socket.on(
    "attack",
    withValidation(socket, attackSchema, async (socket, data, callback) => {
      const { gameId, attackerId, targetId, wishedNumberOfDices } = data;

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("game couldn't be found in attack"));
      }

      const game = GameService.getGame(gameId);

      const attacker = game!.getGameState().getUnitById(attackerId);
      const defender = game!.getGameState().getUnitById(targetId);

      if (!attacker || !defender) {
        return callback(
          errorResponse("attacker or defender not found in attack"),
        );
      }

      await fight(socket, game!, attacker, defender, wishedNumberOfDices);
      callback(successResponse());
    }),
  );

  socket.on(
    "drink-potion",
    withValidation(
      socket,
      drinkPotionSchema,
      async (socket, data, callback) => {
        const { gameId, potionId, heroId } = data;
        const game = GameService.getGame(gameId);

        if (!requireGameExists(gameId)) {
          return callback(
            errorResponse("game couldn't be found in drink-potion"),
          );
        }

        if (!requirePlayerTurn(socket, game!)) {
          return callback(
            errorResponse("it's not your turn to play in drink-potion"),
          );
        }

        const hero = game!.getCurrentHeroTurn();
        if (!hero) {
          return callback(errorResponse("hero not found in drink-potion"));
        }
        if (hero.id !== heroId) {
          return callback(
            errorResponse(
              "the hero trying to drink the potion is not the current hero turn in drink-potion",
            ),
          );
        }

        const potion = hero.equipment.potions.find(
          (p) => p.reference === potionId,
        );
        if (!potion) {
          return callback(
            errorResponse(
              "potion not found in drink-potion, maybe the hero doesn't have it?",
            ),
          );
        }
        try {
          await hero.drinkPotion(gameId, potion);
        } catch (error) {
          if (error instanceof Error) {
            return callback(
              errorResponse(`the drinking encountered an error : ${error.message}`),
            );
          }
          return callback(
            errorResponse(`the drinking encountered an unexpected error`),
          );
        }

        const io = ServerHeroQuest.getServerInstance().getIo();

        emitGameStateUpdate(io, gameId, game!);

        return callback(successResponse());
      },
    ),
  );

  socket.on(
    "check-for-treasures",
    withValidation(
      socket,
      heroActionSchema,
      (socket, data, callback) => {
        const { gameId, heroId } = data;

        console.debug("checking for treasures for hero", heroId, "in game", gameId);

        if (!requireGameExists(gameId)) {
          return callback(
            errorResponse("game couldn't be found in check-for-treasures"),
          );
        }
        const game = GameService.getGame(gameId);

        if (!requirePlayerTurn(socket, game!)) {
          return callback(
            errorResponse("it's not your turn to play in check-for-treasures"),
          );
        }

        // player may find a special treasure if the room he is in has one
        // for now the game does not handle this case, therefore the game master will have to make the change manually if there is somthing to find
        // Therefore this signal will only work for the game master, who will give the hero looking for the treasure a card

        const io = ServerHeroQuest.getServerInstance().getIo();

        if (!requireGameMaster(socket, game!)) {
          const gameMasterSocket = getGameMasterSocket(io, game!);
          gameMasterSocket?.emit("player-search", {
            playerId: socket.id,
            heroId,
            elementSearched: "treasures",
          });
          return callback(
            successResponse({
              message: `The request has been sent to the game master so that he may respond to it`,
            }),
          );
        }

        const hero = game!.getGameState().getHeroById(heroId);
        if (!hero) {
          return callback(
            errorResponse("hero couldn't be found in check-for-treasures"),
          );
        }

        const treasureCard =
          TreasureCardDeckHandler.getDeck(gameId).pickCard(hero);

        io.to(gameId).emit("card-drawn", {
          hero: hero.toJson(),
          card: treasureCard.toJson(),
        });

        console.debug("treasure card drawn for hero", hero.name, "card", treasureCard.name);

        return callback(successResponse({ treasureCardId: treasureCard.id }));
      },
    ),
  );

  socket.on("check-secret-doors", withValidation(
    socket,
    heroActionSchema,
    (socket, data, callback) => {
      const { gameId, heroId } = data;

      console.debug("checking for secret doors for hero", heroId, "in game", gameId);

      if (!requireGameExists(gameId)) {
        return callback(
          errorResponse("game couldn't be found in check-secret-doors"),
        );
      }
      const game = GameService.getGame(gameId);

      if (!requirePlayerTurn(socket, game!)) {
        return callback(
          errorResponse("it's not your turn to play in check-secret-doors"),
        );
      }

      const io = ServerHeroQuest.getServerInstance().getIo();

      if (!requireGameMaster(socket, game!)) {
        const gameMasterSocket = getGameMasterSocket(io, game!);
        gameMasterSocket?.emit("player-search", {
          heroId,
          playerId: socket.id,
          elementSearched: "secretDoors",
        });
        return callback(
          successResponse({
            message: `request sent to game master`,
          }),
        );
      }

      const hero = game!.getGameState().getHeroById(heroId);
      if (!hero) {
        return callback(
          errorResponse("hero couldn't be found in check-secret-doors"),
        );
      }

      // Implementation for checking secret doors would go here
      // For now, we'll just return a success response
      return callback(successResponse());
    },
  ));
}
