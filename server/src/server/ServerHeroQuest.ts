import { Game } from "../POO/classes/Server/Game";

import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { SocketData } from "../POO/interfaces/Socket/SocketData";
import path from "path/win32";
import { ServerToClientEvents } from "../POO/interfaces/Events/ServerToClientEvents";
import { ClientToServerEvents } from "../POO/interfaces/Events/ClientToServerEvents";

class ServerHeroQuest {
    private static serverInstance: ServerHeroQuest | undefined = undefined;

    app = express();
    httpServer = createServer(this.app);
    io = new Server<ClientToServerEvents, ServerToClientEvents, SocketData>(
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
                modifiedGames.push(game);
            }
        });
        return modifiedGames;
    }
}

export { ServerHeroQuest };