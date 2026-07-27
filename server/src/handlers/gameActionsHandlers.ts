import { Socket } from "socket.io";
import { requireGameExists } from "../guards/requireGameExists";
import { requirePlayerTurn } from "../guards/requirePlayerTurn";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { fight } from "../services/CombatService";
import {
  emitGameStateUpdate,
  getGameMasterSocket,
} from "../utils/gameStateEmitter";
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
  selectWeaponSchema,
} from "../validation";
import { TreasureCardDeckHandler } from "../POO/classes/Treasures/TreasureCardDeck";
import { requireGameMaster } from "../guards/requireGameMaster";

export function registerGameActionsHandlers(socket: Socket) {
  ///** common player and game master actions **///

  // cast-spell
  socket.on(
    "cast-spell",
    withValidation(socket, castSpellSchema, (socket, data, callback) => {
      console.debug("casting spell", data);
      const { gameId, playerId, spellId, position } = data;
      const game = GameService.getGame(gameId);

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Le jeu n'a pas été trouvé"));
      }

      if (!requirePlayerTurn(playerId, game!)) {
        return callback(errorResponse("Ce n'est pas votre tour de jouer"));
      }

      try {
        game!.getCurrentPlayerTurn();
      } catch (error) {
        return callback(
          errorResponse(
            "Le joueur lançant le sort n'a pas été trouvé : " +
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
        return callback(
          errorResponse("Le sort ou la cible n'ont pas été trouvés"),
        );
      }

      heroCaster.castSpell(spellToCast, targetUnit);

      const io = ServerHeroQuest.getServerInstance().getIo();

      emitGameStateUpdate(io, gameId, game!);

      callback(successResponse());
    }),
  );

  socket.on(
    "select-weapon",
    withValidation(socket, selectWeaponSchema, (socket, data, callback) => {
      const { gameId, heroId, weaponId } = data;

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Le jeu n'a pas été trouvé"));
      }

      const game = GameService.getGame(gameId);

      const hero = game!.gameState.getHeroById(heroId);
      if (!hero) {
        return callback(errorResponse("Le héros n'a pas été trouvé"));
      }

      const player = game!.getPlayer(hero.controlledByPlayerId);
      if (!player) {
        return callback(
          errorResponse(
            "Le joueur n'a pas été trouvé ou ne contrôle pas le héros",
          ),
        );
      }

      if (!hero.equipment.hasEquipment(weaponId)) {
        return callback(
          errorResponse("Le héros ne possède pas l'arme spécifiée"),
        );
      }
      hero.equipment.setSelectedWeaponIndex(
        hero.equipment.weapons.findIndex((w) => w.reference === weaponId),
      );

      const io = ServerHeroQuest.getServerInstance().getIo();
      emitGameStateUpdate(io, gameId, game!);
    }),
  );

  socket.on(
    "attack",
    withValidation(socket, attackSchema, (socket, data, callback) => {
      const { gameId, playerId, attackerId, targetId } = data;

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Le jeu n'a pas été trouvé"));
      }

      const game = GameService.getGame(gameId);

      if (!requirePlayerTurn(playerId, game!)) {
        return callback(errorResponse("Ce n'est pas votre tour de jouer"));
      }

      const attacker = game!.getGameState().getUnitById(attackerId);
      const defender = game!.getGameState().getUnitById(targetId);

      if (!attacker || !defender) {
        return callback(
          errorResponse("L'attaqueur ou la cible n'a pas été trouvé"),
        );
      }

      if (attacker.controlledByPlayerId !== playerId) {
        return callback(
          errorResponse("L'unité attaquante n'est pas contrôlée par le joueur"),
        );
      }

      fight(game!, attacker, defender);
      const io = ServerHeroQuest.getServerInstance().getIo();
      emitGameStateUpdate(io, gameId, game!);
      callback(successResponse());
    }),
  );

  socket.on(
    "drink-potion",
    withValidation(socket, drinkPotionSchema, (socket, data, callback) => {
      const { gameId, playerId, potionId, heroId } = data;
      const game = GameService.getGame(gameId);

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Le jeu n'a pas été trouvé"));
      }

      if (!requirePlayerTurn(playerId, game!)) {
        return callback(errorResponse("Ce n'est pas votre tour de jouer"));
      }

      const hero = game!.getCurrentHeroTurn();
      if (!hero) {
        return callback(errorResponse("Le héros n'a pas été trouvé"));
      }
      if (hero.id !== heroId) {
        return callback(errorResponse("Ce n'est pas au tour du héros"));
      }

      const potion = hero.equipment.potions.find(
        (p) => p.reference === potionId,
      );
      if (!potion) {
        return callback(
          errorResponse(
            "La potion n'a pas été trouvée dans l'équipement du héros",
          ),
        );
      }
      try {
        hero.drinkPotion(gameId, potion);
      } catch (error) {
        if (error instanceof Error) {
          return callback(errorResponse(`${error.message}`));
        }
        return callback(
          errorResponse(
            `Erreur inattendue lors de la tentative de boire la potion`,
          ),
        );
      }

      const io = ServerHeroQuest.getServerInstance().getIo();

      emitGameStateUpdate(io, gameId, game!);

      return callback(successResponse());
    }),
  );

  socket.on(
    "check-for-treasures",
    withValidation(socket, heroActionSchema, (socket, data, callback) => {
      const { gameId, playerId, heroId } = data;

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Le jeu n'a pas été trouvé"));
      }
      const game = GameService.getGame(gameId);

      if (!requirePlayerTurn(playerId, game!)) {
        return callback(errorResponse("Ce n'est pas votre tour de jouer"));
      }

      // player may find a special treasure if the room he is in has one
      // for now the game does not handle this case, therefore the game master will have to make the change manually if there is somthing to find
      // Therefore this signal will only work for the game master, who will give the hero looking for the treasure a card

      const io = ServerHeroQuest.getServerInstance().getIo();

      if (!requireGameMaster(playerId, game!)) {
        const gameMasterSocket = getGameMasterSocket(io, game!);
        gameMasterSocket?.emit("player-search", {
          playerId,
          heroId,
          elementSearched: "treasures",
        });
        return callback(
          successResponse({
            message: `La demande a été envoyée au maître du jeu pour qu'il puisse y répondre`,
          }),
        );
      }

      const hero = game!.getGameState().getHeroById(heroId);
      if (!hero) {
        return callback(
          errorResponse(
            "Le héros n'a pas été trouvé lors de la recherche de trésors",
          ),
        );
      }

      let treasureCard;
      try {
        treasureCard = TreasureCardDeckHandler.getDeck(gameId).pickCard(hero);
      } catch (error) {
        if (error instanceof Error) {
          return callback(errorResponse(`${error.message}`));
        } else {
          return callback(
            errorResponse(
              "Erreur inattendue lors de la tentative de tirage d'une carte trésor",
            ),
          );
        }
      }

      io.to(gameId).emit("card-drawn", {
        hero: hero.toJson(),
        card: treasureCard.toJson(),
      });

      return callback(successResponse({ treasureCardId: treasureCard.id }));
    }),
  );

  socket.on(
    "check-secret-doors",
    withValidation(socket, heroActionSchema, (socket, data, callback) => {
      const { gameId, playerId, heroId } = data;

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Le jeu n'a pas été trouvé"));
      }
      const game = GameService.getGame(gameId);

      if (!requirePlayerTurn(playerId, game!)) {
        return callback(errorResponse("Ce n'est pas votre tour de jouer"));
      }

      const io = ServerHeroQuest.getServerInstance().getIo();

      if (!requireGameMaster(playerId, game!)) {
        const gameMasterSocket = getGameMasterSocket(io, game!);
        gameMasterSocket?.emit("player-search", {
          heroId,
          playerId,
          elementSearched: "secretDoors",
        });
        return callback(
          successResponse({
            message: `La demande a été envoyée au maître du jeu pour qu'il puisse y répondre`,
          }),
        );
      }

      const hero = game!.getGameState().getHeroById(heroId);
      if (!hero) {
        return callback(
          errorResponse(
            "Le Héros n'a pas été trouvé lors de la vérification des portes secrètes",
          ),
        );
      }

      // Implementation for checking secret doors would go here
      // For now, we'll just return a success response
      return callback(successResponse());
    }),
  );
}
