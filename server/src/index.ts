import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import path from "path";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
  GameState,
  Player,
  PlayerRole,
  Position,
  tileType,
  Monster,
  Tile,
  Direction,
  heroClass,
  Unit,
  monsterClass,
} from "../src/shared/type";
import {
  checkOnlyOneGameMaster,
  convertGameStateAsSendableGameState,
  fiveHeroPlayers,
  generateMonsterId,
  isPlayer,
  positionKey,
} from "./shared/util";

import { canMove, getPositionAfterMove } from "./shared/wallFunctions";
import { initializeBoard, initializeWalls } from "./shared/initializator";
import { generateMonster } from "./shared/monsterGenerate";
import { placeDoor } from "./shared/doors";
import {
  handleRollFightDice,
  handleRollRedDice,
  handleSpecialRollAuth,
} from "./shared/dicesControllers";

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, SocketData>(
  httpServer,
  {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  }
);

app.use(express.static(path.join(__dirname, "../../client/build")));

const games = new Map<string, GameState>();

io.on(
  "connection",
  (
    socket: Socket<ClientToServerEvents, ServerToClientEvents, SocketData, any>
  ) => {
    console.log("Un utilisateur connecté:", socket.id);

    // join game
    socket.on(
      "join-game",
      (data: { gameId: string; playerName: string; role: PlayerRole }) => {
        console.log("join-game caught");

        const { gameId, playerName, role } = data;
        console.log("gameId : ", gameId, "playerName : ", playerName);
        if (!gameId || !playerName) {
          socket.emit("join-error", "Données manquantes");
          return;
        }

        socket.join(gameId);

        const isThereGame: GameState | undefined = games.get(gameId);
        let game: GameState;
        if (!isThereGame) {
          game = {
            id: gameId,
            status: "lobby",
            players: new Map<string, Player>(),
            monsters: new Map<string, Monster>(),
            entityPositions: new Map<string, Position>(),
            positionEntities: new Map<string, string>(),
            board: initializeBoard(),
            currentTurn: socket.id,
            walls: initializeWalls(),
            doors: { horizontal: [], vertical: [] },
            turnOrder: [],
          };
          games.set(gameId, game);
        } else {
          game = isThereGame;
          if (role === "game-master" && game) {
            if (!checkOnlyOneGameMaster(game)) {
              console.error(
                "two game-master isn't possible in a game connection interrupted"
              );
              socket.emit("error", "a game master is already in this game");
              return;
            }
          }
          if (game.players.size >= 5) {
            console.error("game is full of players");
            socket.emit("error", "game is full of players");
            return;
          }
          if (game.status === "playing") {
            console.error("game is already launched you can't join");
            socket.emit("error", "game is already launched");
            return;
          }
          if (fiveHeroPlayers(game, role)) {
            console.error(
              "there's already 4 hero players and there can't be a fifth one"
            );
            socket.emit(
              "error",
              "there's already 4 heros in this game and there can't be a fifth one... please select game master or choose another gameId"
            );
            return;
          }
        }
        const newPlayer: Player = {
          id: socket.id,
          role: role,
          ready: role === "game-master",
          stats: {
            name: playerName,
          },
        };
        if (!game) {
          console.error("fatal error : game couldn't be created");
          return;
        }
        game.players.set(socket.id, newPlayer);

        if (role === "game-master") {
          game.turnOrder[4] = socket.id;
        } else {
          if (game.turnOrder[4] === undefined) {
            game.turnOrder.push(socket.id);
            console.debug("just pushing");
          } else {
            for (let i = 0; i < 4; i++) {
              // there's never more than 5 players
              if (game.turnOrder[i] === undefined) {
                game.turnOrder[i] = socket.id;
                console.debug("inserting");
                break;
              }
            }
          }
        }
        console.log("turn order : ", game.turnOrder);

        if (game.turnOrder[0]) {
          game.currentTurn = game.turnOrder[0];
        }

        socket.emit("join-success", {
          playerId: socket.id,
          game: convertGameStateAsSendableGameState(game),
        });

        io.to(gameId).emit("game-state-update", {
          gameState: convertGameStateAsSendableGameState(game),
        });

        console.log(`${playerName} a rejoint la partie ${gameId}`);
      }
    );

    //leave-lobby
    socket.on("leave-lobby", (data: { gameId: string }) => {
      const game = games.get(data.gameId);
      if (!game) return;

      removePlayerFromGame(socket.id, game);

      // we shouldn't have to remove that many informations but just making sure
      io.to(data.gameId).emit("game-state-update", {
        gameState: convertGameStateAsSendableGameState(game),
      });
      return;
    });

    // start-game
    socket.on("start-game", (data: { gameId: string }) => {
      console.log("🎯 Demande de démarrage pour la partie:", data.gameId);

      const game = games.get(data.gameId);
      if (!game) {
        console.log("❌ Partie non trouvée");
        socket.emit("error", "Partie non trouvée");
        return;
      }

      const player = game.players.get(socket.id);
      if (!player) {
        console.log("❌ Joueur non trouvé dans la partie");
        socket.emit("error", "Joueur non trouvé");
        return;
      }

      if (player.role !== "game-master") {
        console.log("❌ Seul le maître du jeu peut lancer la partie");
        socket.emit("error", "Seul le maître du jeu peut lancer la partie");
        return;
      }

      if (game.players.size < 1) {
        console.log("❌ Pas assez de joueurs");
        socket.emit("error", "Il faut au moins 1 joueur");
        return;
      }

      console.log("✅ Conditions remplies, lancement de la partie...");

      game.status = "playing";
      let pos: Position = { x: 9, y: 9 };
      for (let player of game.players.values()) {
        if (player.role === "game-master") {
          // no hero to place on the board for this player
        } else {
          const tile: Tile | undefined = game.board[pos.x]?.[pos.y];
          if (!tile) return;
          tile.entityId = player.id;
          tile.type = tileType.hero;
          game.entityPositions.set(player.id, pos);
          game.positionEntities.set(positionKey(pos), player.id);
          pos = { x: pos.x + 1, y: pos.y };
        }
      }
      const firstPlayerId = game.turnOrder.find((elem) => {
        console.log(elem);
        return elem !== undefined;
      });
      if (!firstPlayerId) {
        console.error("no first player could be found");
        return;
      }
      game.currentTurn = firstPlayerId;
      console.log("game turnorder : ", game.turnOrder);
      io.to(data.gameId).emit("game-start", {
        gameState: convertGameStateAsSendableGameState(game),
      });
      console.log("📢 Notification game-start envoyée à tous les joueurs");
      console.log(game.players);
      console.log("list of players : ");
      for (let key of game.players) {
        console.log("", key[1].stats);
      }
    });

    // disconnect
    socket.on("disconnect", () => {
      const gameWithFoundPlayer = new Map<string, GameState>();

      // finding the games in which the player is present (there should be only one)
      games.forEach((gameState: GameState, gameId: string) => {
        if (gameState.players.get(socket.id) !== null)
          gameWithFoundPlayer.set(gameId, gameState);
      });
      const gameId = gameWithFoundPlayer.keys().next().value;
      if (gameId === undefined) {
        console.error("no game with player");
        return;
      }
      const game = games.get(gameId);
      if (!game) return;

      removePlayerFromGame(socket.id, game);

      io.to(gameId).emit("game-state-update", {
        gameState: convertGameStateAsSendableGameState(game),
      });
      return;
    });

    // place-element
    socket.on(
      "place-element",
      (data: {
        gameId: string;
        position: Position;
        selectedType: tileType | Direction;
        playerId: string;
        monsterType: monsterClass;
      }) => {
        console.debug("placing element", data);
        const { gameId, position, selectedType, playerId, monsterType } = data;
        if (selectedType === undefined || selectedType === null) return;
        const gameState = games.get(gameId);
        if (!gameState) {
          console.error("no game found");
          return;
        }
        if (gameState.players.get(playerId)?.role !== "game-master") {
          console.error(
            "you are no game master therefore you can't place pieces on the board"
          );
          return;
        }
        let tile = gameState?.board?.[position.x]?.[position.y];
        if (tile === undefined) {
          console.error("tile undefined in index.ts");
          return;
        }
        if (typeof selectedType === typeof Direction.UP) {
          const newDoor = placeDoor(position, selectedType, gameState, gameId);
          io.to(gameId).emit("door-placed", {
            position: newDoor.position,
            verticalOrHorizontal: newDoor.verticalOrHorizontal,
          });
          return;
        }

        if (selectedType === tileType.empty) {
          // erasing the tile
          const entityId = gameState.positionEntities.get(
            positionKey(position)
          );
          if (entityId) {
            gameState.entityPositions.delete(entityId);
            gameState.positionEntities.delete(positionKey(position));
          }
        }

        if (tile?.type !== tileType.empty && selectedType !== tileType.empty) {
          console.error("tile is occupied");
          return;
        }

        tile.type = selectedType as tileType;

        if (monsterType !== null && monsterType !== undefined) {
          console.debug("adding monster", monsterType);

          const newMonsterId = generateMonsterId(gameState);

          gameState.entityPositions.set(newMonsterId, position);
          gameState.positionEntities.set(positionKey(position), newMonsterId);
          const monster = generateMonster(newMonsterId, monsterType);
          gameState.monsters.set(newMonsterId, monster);
        }
        io.to(gameId).emit("game-state-update", {
          gameState: convertGameStateAsSendableGameState(gameState),
        });
      }
    );

    const sleep = (ms: number) => {
      return new Promise((r) => setTimeout(r, ms));
    };

    // roll-dice
    handleRollFightDice(io, socket, games, sleep);

    //roll-red-dice
    handleRollRedDice(io, socket, games, sleep);

    // authorize-special-throw-dices
    handleSpecialRollAuth(socket, games);

    // move-unit-one-step
    socket.on(
      "move-unit-one-step",
      (
        data: { gameId: string; unitId: string; direction: Direction },
        callback: (response: { success: boolean; error?: string }) => void
      ) => {
        const gameState = games.get(data.gameId);
        if (!gameState) {
          console.error("game couldn't be found in move-unit-one-step");
          return callback({
            success: false,
            error: "La partie n'existe plus.",
          });
        }
        const moverPlayer = gameState.players.get(socket.id);
        if (!moverPlayer) {
          console.error(
            "player moving unit couldn't be found in move-unit-one-step"
          );
          return callback({
            success: false,
            error: "Le joueur déplaçant l'unité n'a pas été trouvé.",
          });
        }

        const unit =
          gameState.players.get(data.unitId) ||
          gameState.monsters.get(data.unitId);
        if (!unit) {
          console.error("unit couldn't be found in move-unit-one-step");
          return callback({
            success: false,
            error: "L'unité n'a pas été trouvée.",
          });
        }
        if (
          isPlayer(unit) &&
          gameState.currentTurn !== unit.id &&
          moverPlayer.role !== "game-master"
        ) {
          console.error("not your turn");
          return callback({
            success: false,
            error: "Ce n'est pas votre tour.",
          });
        }
        const position = gameState.entityPositions.get(unit.id);
        if (!position) {
          console.error(
            "position of unit couldn't be found in move-unit-one-step"
          );
          return callback({
            success: false,
            error: "La position de l'unité n'a pas été trouvée.",
          });
        }

        if (!canMove(gameState, position, data.direction)) {
          console.error(
            "movement isn't valid SHOULD HANDLE THAT SO HERO DOESN4T LOSE HIS ACTION"
          );
          return callback({
            success: false,
            error: "le mouvement n'est pas valide",
          });
        }
        const newPosition = getPositionAfterMove(position, data.direction);
        if (newPosition === position) {
          console.error(
            "no movement SHOULD HANDLE THAT SO HERO DOESN4T LOSE HIS ACTION"
          );
          return callback({ success: false, error: "aucun mouvement" });
        }
        const tile = gameState.board[position.x]?.[position.y];
        const newTile = gameState.board[newPosition.x]?.[newPosition.y];

        if (!tile || !newTile) {
          console.error("tiles not found in board");
          return callback({
            success: false,
            error: "les tuiles n'ont pas été trouvées sur le plateau",
          });
        }

        console.log("movement handled should update");

        newTile.entityId = unit.id;
        if (isPlayer(unit)) {
          newTile.type = tileType.hero;
        } else {
          newTile.type = tileType.monster;
        }
        tile.entityId = undefined;
        tile.type = tileType.empty;
        gameState.entityPositions.set(unit.id, newPosition);
        gameState.positionEntities.set(positionKey(newPosition), unit.id);
        const oldPositionKey = { x: position.x, y: position.y };
        gameState.positionEntities.delete(positionKey(oldPositionKey));

        io.to(data.gameId).emit("game-state-update", {
          gameState: convertGameStateAsSendableGameState(gameState),
        });

        return callback({ success: true });
      }
    );

    //end-turn
    socket.on("end-turn", (data: { gameId: string }) => {
      console.log("end-turn");

      const game = games.get(data.gameId);
      if (!game) return;
      if (game.currentTurn !== socket.id) {
        console.error("can't end turn it's not your turn...");

        return;
      }
      console.log(game.turnOrder);

      let playerFound = false;

      for (let i = 0; i < game.turnOrder.length; i++) {
        let nextPlayer = game.turnOrder[i + 1];
        console.log(i);
        console.log(game.turnOrder[i]);
        console.log(game.currentTurn);
        if (i === 4) {
          //last element of the list going back to first
          nextPlayer = game.turnOrder.find((elem) => {
            return elem !== undefined;
          });
          game.currentTurn = nextPlayer ?? "";
        }
        if (game.turnOrder[i] === game.currentTurn) {
          playerFound = true;
          if (nextPlayer !== undefined) {
            game.currentTurn = nextPlayer;
            break;
          }
        }
        if (playerFound && nextPlayer) {
          console.log("new player found ! : ", nextPlayer);
          game.currentTurn = nextPlayer;
          break;
        }
      }

      io.to(data.gameId).emit("game-state-update", {
        gameState: convertGameStateAsSendableGameState(game),
      });
    });

    // choose-character
    socket.on(
      "choose-character",
      (
        data: {
          gameId: string;
          playerId: string;
          heroType: heroClass;
          stats: Unit;
        },
        callback
      ) => {
        const { gameId, playerId, heroType, stats } = data;
        const game = games.get(gameId);

        if (!game) {
          return callback({ success: false, error: "Game not found." });
        }

        const player = game.players.get(playerId);
        if (!player) {
          return callback({ success: false, error: "Player not found." });
        }

        // Validate stats
        const excludedStats = ["name", "spells"]; //thoses stats are not numbers and will be validated differently
        for (const value of Object.values(stats)) {
          const statName =
            Object.keys(stats).find((k) => (stats as any)[k] === value) ??
            "unknown";
          if (
            !excludedStats.includes(statName) &&
            (value === null ||
              value === undefined ||
              isNaN(value) ||
              Number(value) < 0)
          ) {
            console.error(`Invalid stat "${statName}" value: `, value);
            return callback({
              success: false,
              error: `Invalid stat "${statName}" value: ${value}`,
            });
          }
        }

        // Ensure game is in the lobby state
        if (game.status !== "lobby") {
          return callback({
            success: false,
            error: "Cannot change character during the game.",
          });
        }

        // Check if the hero class is already selected
        if (
          Array.from(game.players.values()).some(
            (p) => p.class === heroType && p.id !== playerId
          )
        ) {
          return callback({
            success: false,
            error: "Class already selected by another player.",
          });
        }

        // Validate spells
        if (stats.spells) {
          for (const spell of stats.spells) {
            if (
              Array.from(game.players.values()).some(
                (p) => p.stats?.spells?.includes(spell) && p.id !== playerId
              )
            ) {
              return callback({
                success: false,
                error: `Spell ${spell} already selected by another player.`,
              });
            }
          }
        }

        // Specific validations for Elf and Cleric
        if (heroType === heroClass.Elf && stats?.spells?.length !== 1) {
          return callback({
            success: false,
            error: "Elf must select exactly one spell.",
          });
        }

        if (heroType === heroClass.Cleric && stats?.spells?.length !== 3) {
          return callback({
            success: false,
            error: "Cleric must select exactly three spells.",
          });
        }

        // If all validations pass, update the player's class and stats
        player.class = heroType;
        // ensure stats object exists before assigning additional properties
        player.stats = stats;
        player.ready = true;

        io.to(gameId).emit("game-state-update", {
          gameState: convertGameStateAsSendableGameState(game),
        });
        return callback({
          success: true,
          gameState: convertGameStateAsSendableGameState(game),
        });
      }
    );

    //unselect-character
    socket.on("unselect-character", (data: { gameId: string }) => {
      const { gameId } = data;
      const game = games.get(gameId);
      const player = game?.players.get(socket.id);
      if (!game || !player) return;

      player.class = undefined;
      if (player.stats !== undefined) {
        player.stats = {
          name: player.stats.name,
          spells: undefined,
          hp: undefined,
          maxHp: undefined,
          nbAttackDice: undefined,
          nbDefenseDice: undefined,
          movements: undefined,
          gold: undefined,
        };
      }
      player.ready = false;

      io.to(gameId).emit("game-state-update", {
        gameState: convertGameStateAsSendableGameState(game),
      });
    });

    //update-stats-unit
    socket.on(
      "update-stats-unit",
      (
        data: {
          gameId: string;
          newStats: Unit;
          position: Position;
        },
        callback
      ) => {
        const { gameId, newStats, position } = data;
        const game = games.get(gameId);
        if (!game) {
          return callback({ success: false, error: "Game not found." });
        }
        const player = game.players.get(socket.id);
        if (!player) {
          return callback({ success: false, error: "Player not found." });
        }
        if (player.role !== "game-master") {
          return callback({
            success: false,
            error: "Only game master can update stats.",
          });
        }

        const entityIdAtPosition = game.positionEntities.get(
          positionKey(position)
        );

        console.debug("entityId found : ", entityIdAtPosition);
        if (!entityIdAtPosition) {
          return callback({
            success: false,
            error:
              "le serveur n'a pas trouvé d'unité à la position sélectionnée.",
          });
        }

        const existingPlayer = game.players.get(entityIdAtPosition);
        const existingMonster = game.monsters.get(entityIdAtPosition);
        if (existingPlayer) {
          existingPlayer.stats = { ...existingPlayer.stats, ...newStats };
          game.players.set(entityIdAtPosition, existingPlayer);
          console.log("sending to game : ", gameId);

          io.to(gameId).emit("stats-updated", {
            entityId: entityIdAtPosition,
            newStats: newStats,
            isPlayer: true,
          });
          console.log(
            "emitting stats-updated for player :",
            entityIdAtPosition
          );
          console.log("newStats", game.players.get(entityIdAtPosition));

          return callback({ success: true });
        } else if (existingMonster) {
          game.monsters.set(entityIdAtPosition, existingMonster);
          io.to(gameId).emit("stats-updated", {
            entityId: entityIdAtPosition,
            newStats: newStats,
            isPlayer: false,
          });
          return callback({ success: true });
        } else {
          return callback({
            success: false,
            error: "Pas d'unité à modifier sur cette case.",
          });
        }
      }
    );
  }
);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

function removePlayerFromGame(playerId: string, game: GameState) {
  const player = game.players.get(playerId);
  if (!player) {
    console.log("no player found");
    return;
  }
  if (player.id !== undefined) {
    console.log("removing player because of deconnection");
    game.players.delete(player.id);
  }
  if (game.players.size === 0) {
    console.log("no player connected to game deleting...");
    games.delete(game.id);
  }
  for (let i = 0; i < game.turnOrder.length; i++) {
    if (game.turnOrder[i] == player.id) {
      game.turnOrder[i] = undefined;
    }
  }
  console.log("turn order after deconnection : ", game.turnOrder);

  const pos = game.entityPositions.get(playerId);
  game.entityPositions.delete(playerId);
  if (pos) {
    game.positionEntities.delete(positionKey(pos));
  }
  console.log("Utilisateur déconnecté:", playerId);
}
