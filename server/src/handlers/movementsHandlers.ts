import { Socket, Server } from "socket.io";
import { ClientToServerEvents } from "../POO/interfaces/Events/ClientToServerEvents";
import { ServerToClientEvents } from "../POO/interfaces/Events/ServerToClientEvents";
import { GameService } from "../services/GameService";
import { Direction } from "../POO/enums/Direction";
import { requireGameExists } from "../guards/requireGameExists";
import { requirePlayerTurn } from "../guards/requirePlayerTurn";
import { Unit } from "../POO/classes/Units/Unit";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { MonsterCategory } from "../POO/enums/Categories/MonsterCategory";
import {
    getUnitToMove,
    handleDoorOpening,
    moveUnit,
} from "../services/MovementService";
import { Board } from "../POO/classes/Board/Board";
import { Position } from "../POO/classes/Position/Position";

function registerMovementHandlers(
    socket: Socket,
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    gameService: GameService,
) {
    socket.on(
        "move-unit-one-step",
        (
            data: { gameId: string; unitId: string; direction: Direction },
            callback: (response: { success: boolean; error?: string }) => void,
        ) => {
            if (!requireGameExists(data.gameId, gameService)) {
                return callback({
                    success: false,
                    error: "La partie n'existe plus.",
                });
            }

            if (!requirePlayerTurn(socket, gameService.getGame(data.gameId)!)) {
                return callback({
                    success: false,
                    error: "Ce n'est pas votre tour.",
                });
            }
            const game = gameService.getGame(data.gameId);

            const isGameMaster = game!.getGameMaster()?.id === socket.id;

            const unitMoved: Unit<HeroCategory | MonsterCategory> | null =
                getUnitToMove(game!, data.unitId, isGameMaster);

            const position: Position | null =
                game!.gameState.board.getPositionOfUnit(unitMoved?.id);

            if (!position || !unitMoved) {
                console.error(
                    "position of unit couldn't be found in move-unit-one-step",
                );
                return callback({
                    success: false,
                    error: "La position de l'unité n'a pas été trouvée.",
                });
            }

            const board: Board = game!.gameState.board;

            moveUnit(board, position, data.direction, unitMoved);

            handleDoorOpening(board, position, data.direction);

            io.to(data.gameId).emit("game-state-update", {
                game: game!,
            });

            return callback({ success: true });
        },
    );
}

export { registerMovementHandlers };
