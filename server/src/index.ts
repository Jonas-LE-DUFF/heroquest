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

import {
  canMove,
  getPositionAfterMove,
  hasDoor,
  openDoor,
} from "./shared/wallFunctions";
import { initializeBoard, initializeWalls } from "./shared/initializator";
import { generateMonster } from "./shared/monsterGenerate";
import { placeDoor } from "./shared/doors";
import {
  handleRollFightDice,
  handleRollRedDice,
  handleSpecialRollAuthorization,
} from "./handlers/diceHandler";
import { castSpell } from "./shared/spell/spellEffects";
import { attack } from "./shared/attack/attack";
import { ServerHeroQuest } from "./server/ServerHeroQuest";

const server : ServerHeroQuest = new ServerHeroQuest();

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, SocketData>(
  httpServer,
  {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  },
);

app.use(express.static(path.join(__dirname, "../../client/build")));

const games = new Map<string, GameState>();

io.on(
  "connection",
  (
    socket: Socket<ClientToServerEvents, ServerToClientEvents, SocketData, any>,
  ) => {
    console.log("Un utilisateur connecté:", socket.id);

    // move-unit-one-step
    

    //end-turn
    socket.on("end-turn", (data: { gameId: string }) => {
      console.log("end-turn");

      const game = games.get(data.gameId);
      if (!game) return;
      if (game.currentTurn !== socket.id) {
        console.error("can't end turn it's not your turn...");

        return;
      }

      const nextPlayer = getNextPlayerTurn(game);
      if (!nextPlayer) {
        console.error("no next player found in end-turn");
        return;
      }

      const player = game.players.get(game.currentTurn);
      if (!player) {
        console.error("current player not found in end-turn");
        return;
      }
      if (player.role !== "game-master" && player.stats?.statusEffects) {
        const newStatusEffects = player.stats?.statusEffects?.filter(
          (statusEffect) => {
            if (!statusEffect) {
              return false;
            }
            if (statusEffect.duration === "until the end of next turn") {
              return false;
            }
            return true;
          },
        );
        player.stats.statusEffects = newStatusEffects;
      } else {
        console.info(
          "end of game-master's turn removing status effects of monsters",
        );
        for (const monster of game.monsters.values()) {
          monster.stats.statusEffects = monster.stats.statusEffects?.filter(
            (statusEffect) => {
              if (!statusEffect) {
                return false;
              }
              if (statusEffect.duration === "until the end of next turn") {
                return false;
              }
              return true;
            },
          );
        }
      }
      game.currentTurn = nextPlayer;

      io.to(data.gameId).emit("game-state-update", {
        gameState: convertGameStateAsSendableGameState(game),
      });
    });

    // cast-spell
    socket.on(
      "cast-spell",
      async (
        data: { gameId: string; spellId: string; position: Position },
        callback: (response: { success: boolean; error?: string }) => void,
      ) => {
        console.debug("casting spell", data);
        const { gameId, spellId, position } = data;
        let gameState = games.get(gameId);
        if (!gameState) {
          console.error("game couldn't be found in cast-spell");
          return callback({
            success: false,
            error: "game couldn't be found in cast-spell",
          });
        }
        const castingPlayer = gameState.players.get(socket.id);
        if (!castingPlayer) {
          console.error("player casting spell couldn't be found in cast-spell");
          return callback({
            success: false,
            error: "player casting spell couldn't be found",
          });
        }
        console.debug("spell cast by player", castingPlayer.stats?.name);
        try {
          gameState = await castSpell(
            gameState,
            castingPlayer,
            spellId,
            position,
            socket,
            io,
          );
        } catch (error) {
          const errorMessage = (error as Error).message;
          console.error("error while casting spell :", errorMessage);
          return callback({
            success: false,
            error: "You couldn't cast this spell because : " + errorMessage,
          });
        }

        // Marking spell as used for the player
        if (castingPlayer.stats) {
          if (!castingPlayer.stats.usedSpells) {
            castingPlayer.stats.usedSpells = [];
          }
          castingPlayer.stats.usedSpells.push(spellId);
        }

        console.log("spell casted successfully Player :", castingPlayer.stats);
        if (!gameState) return;
        io.to(gameId).emit("game-state-update", {
          gameState: convertGameStateAsSendableGameState(gameState),
        });

        return callback({ success: true });
      },
    );

    ///** game master actions **///
    // place-element
    socket.on(
      "place-element",
      (data: {
        gameId: string;
        position: Position;
        selectedType: tileType | Direction | monsterClass;
        playerId: string;
      }) => {
        console.debug("placing element", data);
        const { gameId, position, selectedType, playerId } = data;
        if (!selectedType) {
          console.error("no selected type in place-element");
          return;
        }
        console.log("selected type :", selectedType);
        const gameState = games.get(gameId);
        if (!gameState) {
          console.error("no game found");
          return;
        }
        if (gameState.players.get(playerId)?.role !== "game-master") {
          console.error(
            "you are no game master therefore you can't place pieces on the board",
          );
          return;
        }
        if (selectedType.toString().toUpperCase() in Direction) {
          const newDoor = placeDoor(position, selectedType, gameState);
          console.log("new door placed :", newDoor);
          io.to(gameId).emit("door-placed", {
            position: newDoor.position,
            verticalOrHorizontal: newDoor.verticalOrHorizontal,
          });
          return;
        }

        let tile = gameState?.board?.[position.x]?.[position.y];

        if (tile === undefined) {
          console.error("tile couldn't be found on the board");
          return;
        }

        if (selectedType === tileType.empty) {
          // erasing the tile
          console.log("erasing tile at position :", position);
          const entityId = gameState.positionEntities.get(
            positionKey(position),
          );
          if (entityId) {
            gameState.entityPositions.delete(entityId);
            gameState.positionEntities.delete(positionKey(position));
          }
          tile = tileType.empty;
          const row = gameState.board[position.x];
          if (row) {
            row[position.y] = tile;
          }
          io.to(gameId).emit("game-state-update", {
            gameState: convertGameStateAsSendableGameState(gameState),
          });
          return;
        }
        if (tile !== tileType.empty) {
          console.error("tile is occupied");
          return;
        }
        const entityAtPostion = gameState.positionEntities.get(
          positionKey(position),
        );
        if (entityAtPostion) {
          console.error("there's already an entity at this position");
          return;
        }

        if (selectedType in tileType) {
          console.debug("placing tile", selectedType, "at position", position);

          tile = selectedType as tileType;
          const row = gameState.board[position.x];
          if (row) {
            row[position.y] = tile;
          }
          io.to(gameId).emit("tile-placed", {
            position: position,
            tileType: tile,
          });
          return;
        }

        if (selectedType in monsterClass) {
          console.debug("adding monster", selectedType);

          const newMonsterId = generateMonsterId(gameState);

          gameState.entityPositions.set(newMonsterId, position);
          gameState.positionEntities.set(positionKey(position), newMonsterId);
          const monster = generateMonster(
            newMonsterId,
            selectedType as monsterClass,
          );
          console.log("generated monster :", monster);
          gameState.monsters.set(newMonsterId, monster);
        }
        io.to(gameId).emit("game-state-update", {
          gameState: convertGameStateAsSendableGameState(gameState),
        });
      },
    );

    //update-stats-unit
    socket.on(
      "update-stats-unit",
      (
        data: {
          gameId: string;
          newStats: Unit;
          position: Position;
        },
        callback,
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
          positionKey(position),
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

          io.to(gameId).emit("stats-updated", {
            entityId: entityIdAtPosition,
            newStats: newStats,
            isPlayer: true,
          });

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
      },
    );

    // authorize-special-throw-dices
    handleSpecialRollAuthorization(socket, games);

    /// lobby actions
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
        callback,
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
        const excludedStats = ["name", "spells", "equipments"]; //thoses stats are not numbers and will be validated differently
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
            (p) => p.class === heroType && p.id !== playerId,
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
                (p) => p.stats?.spells?.includes(spell) && p.id !== playerId,
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
        stats.movements = 2; // default movement value for heroes
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
      },
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
          statusEffects: [],
        };
      }
      player.ready = false;

      io.to(gameId).emit("game-state-update", {
        gameState: convertGameStateAsSendableGameState(game),
      });
    });

    socket.on(
      "attack",
      async (
        data: {
          gameId: string;
          attackerId: string;
          targetId: string;
          weaponId: string;
        },
        callback: (response: { success: boolean; error?: string }) => void,
      ) => {
        const { gameId, attackerId, targetId, weaponId } = data;
        const gameState = games.get(gameId);
        if (!gameState) {
          console.error("game couldn't be found in attack");
          return callback({
            success: false,
            error: "La partie n'existe plus.",
          });
        }

        console.log("monsters:", gameState.monsters)


        attack(io, socket, gameState, attackerId, targetId, weaponId);
        return callback({ success: true });
      },
    );
  },
);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});