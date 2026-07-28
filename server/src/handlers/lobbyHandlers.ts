import { Socket } from "socket.io";
import { GameService } from "../services/GameService";
import { Player } from "../POO/classes/Server/Player";
import { Game } from "../POO/classes/Server/Game";
import { requireGameExists } from "../guards/requireGameExists";
import { requireGameMaster } from "../guards/requireGameMaster";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { emitGameStateUpdate } from "../utils/gameStateEmitter";
import {
  withValidation,
  successResponse,
  errorResponse,
  joinGameSchema,
  chooseCharacterSchema,
  unselectCharacterSchema,
  gameIdSchema,
} from "../validation";
import { HeroFactory } from "../POO/classes/Factories/HeroFactory";
import { Hero } from "../POO/classes/Units/Hero";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { logger } from "../utils/logger";

export function registerLobbyHandlers(socket: Socket) {
  socket.on(
    "join-game",
    withValidation(socket, joinGameSchema, async (socket, data, callback) => {
      const { gameName, playerName, role } = data;
      logger.info(
        `${playerName} tente de rejoindre la partie : ${gameName} avec le rôle : ${role}`,
      );

      const isThereGame: boolean = GameService.hasGame(gameName);
      let game: Game;

      const newPlayer = new Player(playerName, role, socket.id);

      if (!isThereGame) {
        game = GameService.createGame(gameName, newPlayer);
      } else {
        game = GameService.getGameByName(gameName)!;
        //TODO: check if player is already in the game and prevent joining multiple times
        try {
          game.addPlayer(newPlayer);
        } catch (error) {
          if (error instanceof Error) {
            logger.error("Error adding player to game:", error);
            return callback(errorResponse(`Erreur : ${error}`));
          }
          logger.error("Unexpected error adding player to game.");
          return callback(errorResponse(`Erreur inattendue.`));
        }
      }
      // TODO prevent player from joining multiple games at the same time

      await socket.join(game.id);
      const server = ServerHeroQuest.getServerInstance();
      const sessionStore = server.getSessionStore();
      sessionStore.save({
        sessionToken: socket.handshake.auth.sessionToken as string,
        playerId: newPlayer.id,
        gameId: game.id,
      });

      const io = server.getIo();
      socket.emit("join-success", {
        playerId: newPlayer.id,
        game: game.toJson(),
      });

      emitGameStateUpdate(io, game.id, game);

      logger.info(`${playerName} a rejoint la partie ${game.id}`);

      callback(successResponse());
    }),
  );

  socket.on(
    "leave-game",
    withValidation(socket, gameIdSchema, async (socket, data, callback) => {
      const { gameId, playerId } = data;
      logger.info(
        `Demande de sortie de la partie : ${gameId} | Joueur : ${playerId}`,
      );
      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Partie non trouvée"));
      }

      const game = GameService.getGame(gameId);

      await socket.leave(socket.id);

      if (!game) {
        return callback(errorResponse("Partie non trouvée"));
      }
      game.removePlayer(playerId);

      if (game.getAmountOfPlayers() === 0) {
        logger.warn("Suppression de la partie vide avec l'id :", game.id);
        GameService.removeGame(game.id);
      }
      const io = ServerHeroQuest.getServerInstance().getIo();
      emitGameStateUpdate(io, gameId, game);
      callback(successResponse());
    }),
  );

  socket.on(
    "start-game",
    withValidation(socket, gameIdSchema, (socket, data, callback) => {
      const { gameId, playerId } = data;
      logger.info(`Demande de démarrage pour la partie: ${gameId}`);

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Partie non trouvée"));
      }

      if (!requireGameMaster(playerId, GameService.getGame(gameId)!)) {
        return callback(errorResponse("Utilisateur non autorisé"));
      }

      const game = GameService.getGame(gameId);

      try {
        game!.launchGame();
      } catch (error) {
        if (error instanceof Error) {
          logger.error("Error launching game:", error.message);
          return callback(errorResponse(`Erreur : ${error.message}`));
        }
        logger.error("Erreur inattendue.");
        return callback(errorResponse(`Erreur inattendue.`));
      }

      logger.info("Conditions remplies, lancement de la partie...");
      const io = ServerHeroQuest.getServerInstance().getIo();

      const gameAsJson = game!.toJson();
      io.to(gameId).emit("game-start", {
        game: gameAsJson,
      });
      callback(successResponse(gameAsJson));
    }),
  );

  socket.on(
    "choose-character",
    withValidation(socket, chooseCharacterSchema, (socket, data, callback) => {
      const { heroCreationWish, gameId, playerId } = data;

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Game not found."));
      }

      const game = GameService.getGame(gameId) as Game;

      const player = game.getPlayer(playerId);
      if (!player) {
        logger.error("Player not found with id:", playerId);
        return callback(errorResponse("Player not found."));
      }

      // Ensure game is in the lobby state
      if (game?.gameState.status !== "lobby") {
        return callback(
          errorResponse("Cannot change character during the game."),
        );
      }

      // remove the existing hero if the player is modifying an existing hero
      const modifiedHero = heroCreationWish.modifiedHeroId
        ? game.gameState.getHeroById(heroCreationWish.modifiedHeroId)
        : null;
      if (heroCreationWish.modifiedHeroId) {
        const existingHero = game.gameState.getHeroById(
          heroCreationWish.modifiedHeroId,
        );
        if (existingHero) {
          game.gameState.removeUnit(existingHero);
        } else {
          return callback(
            errorResponse("Existing hero not found for modification."),
          );
        }
      }

      const heroFactory = new HeroFactory();
      let hero: Hero | null = null;
      try {
        hero = heroFactory.createHero(gameId, heroCreationWish);
      } catch (error) {
        if (modifiedHero) game?.gameState.addUnit(modifiedHero);
        logger.error("Error creating hero:", error);
        return callback(
          errorResponse("Error creating hero: " + (error as Error).message),
        );
      }

      hero!.controlledByPlayerId = playerId;

      game?.gameState.addUnit(hero!);

      player.isReady = true;

      const io = ServerHeroQuest.getServerInstance().getIo();
      emitGameStateUpdate(io, gameId, game);
      callback(successResponse(game.toJson()));
    }),
  );

  //unselect-character
  socket.on(
    "unselect-character",
    withValidation(
      socket,
      unselectCharacterSchema,
      (socket, data, callback) => {
        const { heroId, playerId, gameId } = data;

        if (!requireGameExists(gameId)) {
          return callback(errorResponse("Game not found."));
        }

        const game = GameService.getGame(gameId);
        const player = game?.getPlayer(playerId);
        if (!game || !player) {
          logger.error("Player not found with id:", playerId);
          return callback(errorResponse("Player not found."));
        }

        const heroesControlled =
          game.gameState.getHeroesControlledByPlayer(playerId);
        const heroToRemove = game.gameState.getHeroById(heroId);

        if (
          !heroToRemove ||
          (!heroesControlled.includes(heroToRemove) &&
            player.role !== PlayerRole.GAME_MASTER)
        ) {
          return callback(errorResponse("Hero not found."));
        }
        game.gameState.removeUnit(heroToRemove);

        const heroesLeft = heroesControlled.filter((h) => h.id !== heroId);
        if (heroesLeft.length === 0) player.isReady = false;
        const io = ServerHeroQuest.getServerInstance().getIo();

        emitGameStateUpdate(io, gameId, game);
        callback(successResponse());
      },
    ),
  );
}
