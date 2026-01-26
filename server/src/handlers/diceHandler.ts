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
import { requireGameMaster } from "../guards/requireGameMaster";
import { requireGameExists } from "../guards/requireGameExists";
import { GameService } from "../services/GameService";

export function registerDiceHandlers(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    io: Server<ClientToServerEvents, ServerToClientEvents>,
) {
    handleSpecialRollAuthorization(io, socket);
    handleRollRedDice(io, socket);
    handleRollFightDice(io, socket);
}

function handleSpecialRollAuthorization(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) {
    socket.on(
        "authorize-special-throw-dices",
        (data: {
            gameId: string;
            numberOfDices: number;
            typeOfDices: "fight" | "red";
            playerClass: HeroCategory;
        }) => {
            const gameState = GameService.getGame(data.gameId);

            if (!requireGameExists(data.gameId)) return;

            if (!requireGameMaster(socket, gameState!)) return;

            const callback = grantSpecialRollAuthorization(
                gameState!,
                io,
                data.numberOfDices,
                data.typeOfDices,
                data.playerClass,
            );

            return callback;
        },
    );
}

function handleRollRedDice(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) {
    socket.on(
        "roll-red-dice",
        async (
            data: { gameId: string; currentNumberOfDices: number },
            callback,
        ) => {
            const gameState = GameService.getGame(data.gameId);

            if (!requireGameExists(data.gameId)) return;

            const result = await rollRedDice(
                io,
                socket,
                gameState!,
                data.currentNumberOfDices,
            );
            return callback(result);
        },
    );
}

function handleRollFightDice(
    io: Server<ClientToServerEvents, ServerToClientEvents, SocketData>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents, SocketData, any>,
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
            const gameState = GameService.getGame(data.gameId);

            if (!requireGameExists(data.gameId)) return;
            
            const result = await rollFightDice(
                io,
                socket,
                gameState!,
                data.numberOfDice,
            );
            return callback(result);
        },
    );
}
