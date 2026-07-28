import { Game } from "../POO/classes/Server/Game";

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path/win32";
import { ServerToClientEvents } from "../POO/interfaces/Events/ServerToClientEvents";
import { ClientToServerEvents } from "../POO/interfaces/Events/ClientToServerEvents";
import { registerSocketHandlers } from "../socket/SocketRouter";
import { SessionStore } from "./SessionStore";
import { logger } from "../utils/logger";

class ServerHeroQuest {
  private static serverInstance: ServerHeroQuest | undefined = undefined;

  private sessionStore = new SessionStore();
  private app = express();
  private httpServer = createServer(this.app);
  private io = new Server<ClientToServerEvents, ServerToClientEvents>(
    this.httpServer,
    {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    },
  );

  private games: Map<string, Game>; // gameId -> Game

  private constructor() {
    this.games = new Map<string, Game>();
    this.app.use(express.static(path.join(__dirname, "../../client/build")));
    const PORT = process.env.PORT || 5000;
    this.httpServer.listen(PORT, () => {
      logger.info(`Serveur démarré sur le port ${PORT}`);
    });
    registerSocketHandlers(this);
  }

  static getServerInstance(): ServerHeroQuest {
    if (!this.serverInstance) {
      this.serverInstance = new ServerHeroQuest();
    }
    return this.serverInstance;
  }

  createGame(name: string): Game {
    const newGame = new Game(name);
    this.games.set(newGame.id, newGame);
    return newGame;
  }

  getGame(id: string): Game | null {
    return this.games.get(id) || null;
  }

  getGameByName(name: string): Game | null {
    for (const game of this.games.values()) {
      if (game.name === name) {
        return game;
      }
    }
    return null;
  }

  removeGame(id: string): void {
    this.games.delete(id);
  }

  addGame(id: string, game: Game): void {
    this.games.set(id, game);
  }

  removePlayerFromAllGames(playerId: string): Game[] {
    const modifiedGames: Game[] = [];
    this.games.forEach((game) => {
      if (game.hasPlayer(playerId)) {
        game.removePlayer(playerId);
        game.gameState.removeUnitsControlledByPlayer(playerId);
        modifiedGames.push(game);
      }
      if (game.getAmountOfPlayers() === 0) {
        logger.info(`Removing game ${game.name} as it has no more players.`);
        this.removeGame(game.id);
      }
    });
    return modifiedGames;
  }

  getIo(): Server<ClientToServerEvents, ServerToClientEvents> {
    return this.io;
  }

  getSessionStore(): SessionStore {
    return this.sessionStore;
  }
}

export { ServerHeroQuest };
