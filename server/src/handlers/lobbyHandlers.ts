import { Socket } from "socket.io";
import { GameService } from "../services/GameService";
import { Player } from "../POO/classes/Server/Player";
import { Game } from "../POO/classes/Server/Game";
import { requireGameExists } from "../guards/requireGameExists";
import { requireGameMaster } from "../guards/requireGameMaster";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
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
import { Position } from "../POO/classes/Position/Position";
import { Hero } from "../POO/classes/Units/Hero";

export function registerLobbyHandlers(socket: Socket) {
  socket.on(
    "join-game",
    withValidation(socket, joinGameSchema, (socket, data, callback) => {
      const { gameName, playerName, role } = data;
      console.log(
        playerName,
        " tente de rejoindre la partie :",
        gameName,
        " avec le rôle :",
        role,
      );

      const isThereGame: boolean = GameService.hasGame(gameName);
      let game: Game;

      const newPlayer = new Player(playerName, role);
      newPlayer.id = socket.id;

      if (!isThereGame) {
        game = GameService.createGame(gameName, newPlayer);
      } else {
        game = GameService.getGameByName(gameName)!;
        try {
          game.addPlayer(newPlayer);
        } catch (error: any) {
          console.error("Error adding player to game:", error);
          return callback(errorResponse(`Erreur : ${error}`));
        }
      }

      socket.join(game.id);

      const io = ServerHeroQuest.getServerInstance().getIo();
      const gameAsJson = game.toJson();
      socket.emit("join-success", {
        playerId: newPlayer.id,
        game: gameAsJson,
      });

      io.to(game.id).emit("game-state-update", {
        game: gameAsJson,
      });

      console.log(`${playerName} a rejoint la partie ${game.id}`);

      callback(successResponse());
    }),
  );

  socket.on(
    "leave-lobby",
    withValidation(socket, gameIdSchema, (socket, data, callback) => {
      const { gameId } = data;
      console.log(
        "Demande de départ de la partie :",
        gameId,
        " Joueur :",
        socket.id,
      );
      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Partie non trouvée"));
      }

      const game = GameService.getGame(gameId);

      socket.leave(gameId);

      if (!game) {
        return callback(errorResponse("Partie non trouvée"));
      }
      game.removePlayer(socket.id);

      if (game.getAmountOfPlayers() === 0) {
        console.log("Suppression de la partie vide avec l'id :", game.id);
        GameService.removeGame(game.id);
      }
      const io = ServerHeroQuest.getServerInstance().getIo();
      const gameAsJson = game.toJson();
      io.to(gameId).emit("game-state-update", {
        game: gameAsJson,
      });
      callback(successResponse());
    }),
  );

  socket.on(
    "start-game",
    withValidation(socket, gameIdSchema, (socket, data, callback) => {
      const { gameId } = data;
      console.log("Demande de démarrage pour la partie:", gameId);

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Partie non trouvée"));
      }

      if (!requireGameMaster(socket, GameService.getGame(gameId)!)) {
        return callback(errorResponse("Utilisateur non autorisé"));
      }

      const game = GameService.getGame(gameId);

      try {
        game!.launchGame();
      } catch (error: any) {
        console.log("Erreur lors du lancement de la partie :", error.message);
        return callback(errorResponse(error.message));
      }

      console.log("Conditions remplies, lancement de la partie...");
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
      const { heroCreationWish, gameId } = data;

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("Game not found."));
      }

      const game = GameService.getGame(gameId);

      const player = game!.getPlayer(socket.id);
      if (!player) {
        console.error("Player not found with id:", socket.id);
        return callback(errorResponse("Player not found."));
      }

      const heroFactory = new HeroFactory();
      const position = new Position(0, 0); // Default position,  TODO : change value
      const hero: Hero | null = heroFactory.createHero(
        gameId,
        heroCreationWish,
      );
      if (!hero) {
        return callback(errorResponse("Failed to create hero."));
      }

      hero.controlledByPlayerId = socket.id;

      // Validate stats
      const isValid = hero.validateStats();
      if (!isValid.success) {
        return callback(errorResponse(isValid.error!));
      }
      hero.stats.movements = 2; // default movement value for heroes

      // Ensure game is in the lobby state
      if (game?.gameState.status !== "lobby") {
        return callback(
          errorResponse("Cannot change character during the game."),
        );
      }

      // Check if the hero class is already selected
      if (game.gameState.isHeroCategoryTaken(hero.category)) {
        return callback(
          errorResponse("Class already selected by another player."),
        );
      }

      // Validate spells
      const spellsTaken = game.gameState.getSpellsTaken(hero.spells);
      if (spellsTaken.length > 0) {
        return callback(
          errorResponse(
            `The spells ${spellsTaken.map((spell) => spell.name).join(", ")} are already selected by another player.`,
          ),
        );
      }
      game?.gameState.addUnit(hero, position);

      player.isReady = true;
      const io = ServerHeroQuest.getServerInstance().getIo();

      io.to(gameId).emit("game-state-update", {
        game: game.toJson(),
      });
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
        const { heroId, gameId } = data;

        if (!requireGameExists(gameId)) {
          return callback(errorResponse("Game not found."));
        }

        const game = GameService.getGame(gameId);
        const player = game?.getPlayer(socket.id);
        if (!game || !player) {
          console.error("Player not found with id:", socket.id);
          return callback(errorResponse("Player not found."));
        }

        const heroesControlled = game.gameState.getHeroesControlledByPlayer(
          socket.id,
        );

        const heroToRemove = heroesControlled.find((h) => h.id === heroId);
        if (!heroToRemove) {
          return callback(errorResponse("Hero not found."));
        }
        game.gameState.removeUnit(heroToRemove);

        const heroesLeft = heroesControlled.filter((h) => h.id !== heroId);
        if (heroesLeft.length === 0) player.isReady = false;
        const io = ServerHeroQuest.getServerInstance().getIo();

        io.to(gameId).emit("game-state-update", {
          game: game.toJson(),
        });
        callback(successResponse());
      },
    ),
  );
}
