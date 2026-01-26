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
  },
);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});