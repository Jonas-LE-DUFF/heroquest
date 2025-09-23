import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(express.static(path.join(__dirname, "../../client/build")));

const games = new Map();

io.on("connection", (socket) => {
  console.log("Un utilisateur connecté:", socket.id);

  socket.on(
    "join-game",
    (data: { gameId: string; playerName: string; role: string }) => {
      console.log("🎮 Demande de connexion:", data);

      const { gameId, playerName, role } = data;

      if (!gameId || !playerName) {
        socket.emit("join-error", "Données manquantes");
        return;
      }

      socket.join(gameId);
      console.log(`${playerName} a rejoint la partie ${gameId}`);

      if (!games.has(gameId)) {
        games.set(gameId, {
          players: [],
          board: initializeBoard(),
          currentTurn: "heroes",
        });
      }

      const game = games.get(gameId);
      game.players.push({
        id: socket.id,
        name: playerName,
        role: role,
        ready: false,
      });

      socket.emit("join-success", {
        message: `Bienvenue dans la partie ${gameId}, ${playerName}!`,
        playerId: socket.id,
        gameState: game,
      });

      io.to(gameId).emit("game-state-update", game);

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
  socket.on("start-game", (gameId: string) => {
    console.log("🎯 Demande de démarrage pour la partie:", gameId);

    const game = games.get(gameId);
    if (!game) {
      games.forEach((g, id) => {
        console.log(
          `Partie ID: ${id.id}, Joueurs: ${g.players
            .map((p: { name: any }) => p.name)
            .join(", ")}`
        );
      });
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

    if (player.role !== "game-master") {
      console.log("❌ Seul le maître du jeu peut lancer la partie");
      socket.emit("error", "Seul le maître du jeu peut lancer la partie");
      return;
    }

    // Vérifier le nombre minimum de joueurs
    if (game.players.length < 1) {
      console.log("❌ Pas assez de joueurs");
      socket.emit("error", "Il faut au moins 1 joueur");
      return;
    }

    console.log("✅ Conditions remplies, lancement de la partie...");

    // Changer le statut de la partie
    game.status = "playing";
    game.currentTurn = "heroes"; // Les héros commencent

    // Notifier TOUS les joueurs de la partie
    io.to(gameId).emit("game-start", game);
    console.log("📢 Notification game-start envoyée à tous les joueurs");

    console.log(
      "🚀 Partie lancée avec succès! Joueurs:",
      game.players.map((p: { name: any }) => p.name)
    );
  });

  socket.on("get-lobby-state", (gameId: string) => {
    const game = games.get(gameId);
    if (game) {
      socket.emit("lobby-update", { players: game.players });
    }
  });

  socket.on("disconnect", () => {
    console.log("Utilisateur déconnecté:", socket.id);
  });
});

function initializeBoard() {
  return {
    tiles: Array(10)
      .fill(null)
      .map(() => Array(10).fill("empty")),
    heroes: [],
    monsters: [],
  };
}

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
