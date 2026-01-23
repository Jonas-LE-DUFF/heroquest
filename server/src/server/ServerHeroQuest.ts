import { Game } from "../POO/classes/Server/Game";

import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { SocketData } from "../POO/interfaces/Socket/SocketData";
import path from "path/win32";
import { ServerToClientEvents } from "../POO/interfaces/Events/ServerToClientEvents";
import { ClientToServerEvents } from "../POO/interfaces/Events/ClientToServerEvents";

class ServerHeroQuest {
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

    games: Map<string, Game>; // gameId -> Game

    constructor() {
        this.games = new Map<string, Game>();
        this.app.use(express.static(path.join(__dirname, "../../client/build")));
    }

    createGame(id: string, name: string): Game {
        if (this.games.has(id)) {
            throw new Error(`Game with id ${id} already exists.`);
        }
        const newGame = new Game(id, name);
        this.games.set(id, newGame);
        return newGame;
    }

    getGame(id: string): Game | null {
        return this.games.get(id) || null;
    }

    removeGame(id: string): void {
        this.games.delete(id);
    }
}

export { ServerHeroQuest };