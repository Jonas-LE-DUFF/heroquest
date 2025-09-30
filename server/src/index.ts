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
  Position,
  tileType,
  diceFace,
  Monster,
} from "../src/shared/type";
import {
  checkOnlyOneGameMaster,
  convertGameStateAsSendableGameState,
  getAmountOfDices,
  initializeBoard,
  initializeWalls,
} from "./shared/util";

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
          players: new Map<string, Player>(),
          monsters: new Map<string, Monster>(),
          entityPositions: new Map<string, Position>(),
          positionEntities: new Map<Position, string>(),
          board: initializeBoard(),
          currentTurn: socket.id,
          walls: initializeWalls(),
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
      game.players.set(socket.id, newPlayer);

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

  socket.on("player-ready", (data: { gameId: string; ready: boolean }) => {
    console.log("player-ready received:", data);

    const game = games.get(data.gameId);

    if (!game) {
      console.error("no game found related to socket in index.ts");
      return;
    }
    const player = game.players.get(socket.id);
    if (!player) {
      console.error("no player found related to socket");
      return;
    }
    player.ready = data.ready;
    console.log(`Player ${socket.id} ready status: ${data.ready}`);

    io.to(data.gameId).emit("game-state-update", {
      gameState: convertGameStateAsSendableGameState(game),
    });
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
    const player = game.players.get(socket.id);
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
    if (game.players.size < 1) {
      console.log("❌ Pas assez de joueurs");
      socket.emit("error", "Il faut au moins 1 joueur");
      return;
    }

    console.log("✅ Conditions remplies, lancement de la partie...");

    // Changer le statut de la partie
    game.status = "playing";

    // Notifier TOUS les joueurs de la partie
    io.to(data.gameId).emit("game-start", {
      gameState: convertGameStateAsSendableGameState(game),
    });
    console.log("📢 Notification game-start envoyée à tous les joueurs");
    console.log(game.players);
    console.log("list of players : ");
    for (let key of game.players) {
      console.log("", key[1].characterName);
    }
  });

  socket.on("disconnect", () => {
    const gameWithFoundPlayer = new Map<string, GameState>();
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
    if (!game) {
      console.log("no game on disconnect");
      return;
    }
    const player = game.players.get(socket.id);
    if (!player) {
      console.log("no player found");
      return;
    }
    if (player.id !== undefined) {
      console.log("removing player because of deconnection");
      game.players.delete(player.id);
      io.to(gameId).emit("game-state-update", {
        gameState: convertGameStateAsSendableGameState(game),
      });
    }
    if (game.players.size === 0) {
      console.log("no player connected to game deleting...");
      games.delete(gameId);
    }
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
      if (tile?.type !== tileType.empty && selectedType !== tileType.empty) {
        console.error("tile is occupied");
        return;
      }

      if (selectedType === null) {
        console.error("nothing to place");
        return;
      }

      tile.type = selectedType;
      io.to(gameId).emit("game-state-update", {
        gameState: convertGameStateAsSendableGameState(gameState),
      });
    }
  );

  const sleep = (ms: number) => {
    return new Promise((r) => setTimeout(r, ms));
  };
  socket.on(
    "roll-dice",
    async (data: {
      gameId: string;
      playerId: string;
      numberOfDice: number;
    }) => {
      const gameState = games.get(data.gameId);
      let numberOfDices: number | undefined;
      if (!gameState) {
        console.error("game couldn't be found");
        return;
      }
      const playerRole = gameState.players.get(data.playerId)?.role;
      if (playerRole === "hero") {
        numberOfDices = getAmountOfDices(
          gameState,
          data.playerId,
          "att" //TODO : need to know if we attack or defend !!
        );
      } else {
        numberOfDices = data.numberOfDice;
      }
      if (numberOfDices === undefined) {
        console.log("no amount of dice to throw defined");
        return;
      }
      for (let j = 0; j < 15; j++) {
        let results: diceFace[] = [];
        for (let i = 0; i < numberOfDices; i++) {
          const randomNumber = Math.floor(Math.random() * 6 + 1);
          let face: diceFace = diceFace.Hit;
          if (randomNumber === 1) {
            face = diceFace.BlackShield;
          } else if (randomNumber < 3) {
            face = diceFace.WhiteShield;
          } else {
            face = diceFace.Hit;
          }
          results.push(face);
        }
        io.to(data.gameId).emit("dice-update", { listResults: results });
        await sleep(75);
        results = [];
      }
    }
  );

  socket.on("asking-for-game-state", (data: { gameId: string }) => {
    const game = games.get(data.gameId);
    if (!game) {
      console.error("game couln't be found : ", data.gameId);
      return;
    }
    socket.emit("game-state-update", {
      gameState: convertGameStateAsSendableGameState(game),
    });
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
