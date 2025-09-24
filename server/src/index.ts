import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
  GameState,
  Player,
  PlayerRole,
  Tile,
} from "../src/shared/type";

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
    (gameId: string, playerName: string, role: PlayerRole) => {
      if (!gameId || !playerName) {
        socket.emit("join-error", "Données manquantes");
        return;
      }

      socket.join(gameId);

      let game: GameState | undefined;
      if (!games.has(gameId)) {
        game = {
          id: gameId,
          status: "waiting",
          players: [],
          monsters: [],
          board: initializeBoard(),
        };
        games.set(gameId, game);
      } else {
        game = games.get(gameId);
        if (role === "game-master" && game) {
          if (!checkOnlyOneGameMaster(game)) {
            console.log(
              "two game-master isn't possible in a game connection interrupted"
            );
            socket.emit("error", "a game master is already in this game");
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

      io.to(gameId).emit("game-state-update", game);

      console.log(`${playerName} a rejoint la partie ${gameId}`);
    }
  );

  socket.on("player-ready", (gameId: string, ready: boolean) => {
    const game = games.get(gameId);
    if (game) {
      const player = game.players.find(
        (p: { id: string }) => p.id === socket.id
      );
      if (player) {
        player.ready = ready;
        io.to(gameId).emit("lobby-update", { players: game.players });
      }
    }
  });

  // Écouter le démarrage de partie
  socket.on("start-game", (gameId: string) => {
    console.log("🎯 Demande de démarrage pour la partie:", gameId);

    const game = games.get(gameId);
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
    io.to(gameId).emit("game-start", game);
    console.log("📢 Notification game-start envoyée à tous les joueurs");

    console.log(
      "🚀 Partie lancée avec succès! Joueurs:",
      game.players.map((p: { characterName?: any }) => p.characterName)
    );
  });

  socket.on("disconnect", () => {
    console.log("Utilisateur déconnecté:", socket.id);
  });
});

function initializeBoard() {
  return Array(26)
    .fill(null)
    .map(() => Array<Tile>(19).fill({ type: "empty", revealed: false }));
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
