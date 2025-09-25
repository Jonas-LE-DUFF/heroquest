import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path, { posix } from "path";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
  GameState,
  Player,
  PlayerRole,
  Tile,
  Position,
  monsterClass,
  Monster,
  Unit,
  tileType,
} from "../src/shared/type";
import { stat } from "fs";
import { getPlayerRole, getRoleToTurn } from "./shared/util";

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

io.on("connection", (socket) => {
  console.log("Un utilisateur connecté:", socket.id);

  socket.on(
    "join-game",
    (data: { gameId: string; playerName: string; role: PlayerRole }) => {
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
          status: "waiting",
          players: [],
          monsters: [],
          board: initializeBoard(),
        };
        games.set(gameId, game);
      } else {
        game = isThereGame;
        if (role === "game-master" && game) {
          if (!checkOnlyOneGameMaster(game)) {
            console.log(
              "two game-master isn't possible in a game connection interrupted"
            );
            socket.emit("error", "a game master is already in this game");
            return;
          }
        }
      }
      const newPlayer: Player = {
        id: socket.id,
        characterName: playerName,
        role: role,
        ready: false,
      };
      if (!game) {
        console.log("fatal error : game couldn't be created");
        return;
      }
      game.players.push(newPlayer);

      socket.emit("join-success", {
        playerId: socket.id,
        gameState: game,
      });

      io.to(gameId).emit("game-state-update", { gameState: game });

      console.log(`${playerName} a rejoint la partie ${gameId}`);
    }
  );

  socket.on("player-ready", (data: { gameId: string; ready: boolean }) => {
    const game = games.get(data.gameId);
    if (game) {
      const player = game.players.find(
        (p: { id: string }) => p.id === socket.id
      );
      if (player) {
        player.ready = data.ready;
        io.to(data.gameId).emit("lobby-update", { players: game.players });
      }
    }
  });

  // Écouter le démarrage de partie
  socket.on("start-game", (data: { gameId: string }) => {
    console.log("🎯 Demande de démarrage pour la partie:", data.gameId);

    const game = games.get(data.gameId);
    if (!game) {
      console.log("❌ Partie non trouvée");
      socket.emit("error", "Partie non trouvée");
      return;
    }

    // Vérifier que c'est bien le maître du jeu qui lance
    const player = game.players.find((p: { id: string }) => p.id === socket.id);
    if (!player) {
      console.log("❌ Joueur non trouvé dans la partie");
      socket.emit("error", "Joueur non trouvé");
      return;
    }

    // if (player.role !== "game-master") {
    //   console.log("❌ Seul le maître du jeu peut lancer la partie");
    //   socket.emit("error", "Seul le maître du jeu peut lancer la partie");
    //   return;
    // }

    // Vérifier le nombre minimum de joueurs
    if (game.players.length < 1 || game.players[0] === undefined) {
      console.log("❌ Pas assez de joueurs");
      socket.emit("error", "Il faut au moins 1 joueur");
      return;
    }

    console.log("✅ Conditions remplies, lancement de la partie...");

    // Changer le statut de la partie
    game.status = "playing";
    game.currentTurn = game.players[0].id;

    // Notifier TOUS les joueurs de la partie
    io.to(data.gameId).emit("game-start", { gameState: game });
    console.log("📢 Notification game-start envoyée à tous les joueurs");

    console.log(
      "🚀 Partie lancée avec succès! Joueurs:",
      game.players.map((p: { characterName?: any }) => p.characterName)
    );
  });

  socket.on("disconnect", () => {
    console.log("Utilisateur déconnecté:", socket.id);
  });

  socket.on(
    "place-element",
    (data: {
      gameId: string;
      position: Position;
      selectedType: tileType;
      playerId: string;
    }) => {
      const { gameId, position, selectedType, playerId } = data;

      const gameState = games.get(gameId);
      if (!gameState) {
        console.error("no game found");
        return;
      }
      if (getPlayerRole(gameState, playerId) !== "game-master") {
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
      if (tile?.type !== tileType.empty && selectedType !== tileType.empty) {
        console.error("tile is occupied");
        return;
      }

      if (selectedType === null) {
        console.error("nothing to place");
        return;
      }

      tile.type = selectedType;
      io.to(gameId).emit("game-state-update", { gameState });
    }
  );
});

function initializeBoard(): Tile[][] {
  const board: Tile[][] = [];
  const rows = 26;
  const cols = 19;

  for (let i = 0; i < rows; i++) {
    const row: Tile[] = [];
    for (let j = 0; j < cols; j++) {
      row.push({
        type: tileType.empty,
        revealed: false,
      });
    }
    board.push(row);
  }
  return board;
}

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

function checkOnlyOneGameMaster(game: GameState) {
  if (game?.players)
    for (let player of game?.players) {
      if (player.role === "game-master") {
        return false;
      }
    }
  return true;
}

function generateMonsterId(game: GameState) {
  let id = "idMonster" + Math.random().toString(16).slice(2);
  //checking the id is unique among monsters
  for (let monster of game.monsters) {
    if (monster.id === id) {
      id = generateMonsterId(game);
    }
  }
  return id;
}
