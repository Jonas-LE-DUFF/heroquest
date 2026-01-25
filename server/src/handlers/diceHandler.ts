import { Server, Socket } from "socket.io";
import {
    grantSpecialRollAuthorization,
    rollFightDice,
    rollRedDice,
} from "../services/DiceService";
import { ClientToServerEvents } from "../POO/interfaces/Events/ClientToServerEvents";
import { ServerToClientEvents } from "../POO/interfaces/Events/ServerToClientEvents";
import { SocketData } from "../POO/interfaces/Socket/SocketData";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { Game } from "../POO/classes/Server/Game";
import { requireGameMaster } from "../guards/requireGameMaster";
import { requireGameExists } from "../guards/requireGameExists";

export function handleSpecialRollAuthorization(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, SocketData, any>,
    games: Map<string, Game>,
) {
    socket.on(
        "authorize-special-throw-dices",
        (data: {
            gameId: string;
            numberOfDices: number;
            typeOfDices: "fight" | "red";
            playerClass: HeroCategory;
        }) => {
            const gameState = games.get(data.gameId);

            if (!requireGameExists(data.gameId, games)) return;

            if (!requireGameMaster(socket, gameState!)) return;

            const callback = grantSpecialRollAuthorization(
                gameState!,
                socket,
                data.numberOfDices,
                data.typeOfDices,
                data.playerClass,
            );

            return callback;
        },
    );
}

export function handleRollRedDice(
    io: Server<ClientToServerEvents, ServerToClientEvents, SocketData>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents, SocketData, any>,
    games: Map<string, Game>,
) {
    socket.on(
        "roll-red-dice",
        async (
            data: { gameId: string; currentNumberOfDices: number },
            callback,
        ) => {
            const gameState = games.get(data.gameId);

            if (!requireGameExists(data.gameId, games)) return;

            const result = await rollRedDice(
                io,
                socket.id,
                gameState!,
                data.currentNumberOfDices,
            );
            return callback(result);
        },
    );
}

export function handleRollFightDice(
    io: Server<ClientToServerEvents, ServerToClientEvents, SocketData>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents, SocketData, any>,
    games: Map<string, Game>,
) {
    socket.on(
        "roll-dice",
        async (
            data: {
                gameId: string;
                playerId: string;
                numberOfDice: number;
            },
            callback: (response: { success: boolean; error?: string }) => void,
        ) => {
            const gameState = games.get(data.gameId);

            if (!requireGameExists(data.gameId, games)) return;

            const result = await rollFightDice(
                io,
                data.playerId,
                gameState!,
                data.numberOfDice,
            );
            return callback(result);
        },
    );
}
