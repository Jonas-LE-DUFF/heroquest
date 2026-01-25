import { Socket, Server } from "socket.io";
import { ClientToServerEvents } from "../POO/interfaces/Events/ClientToServerEvents";
import { ServerToClientEvents } from "../POO/interfaces/Events/ServerToClientEvents";
import { GameService } from "../services/GameService";
import { Direction } from "../POO/enums/Direction";
import { requireGameExistsGameService } from "../guards/requireGameExists";
import { requirePlayerTurn } from "../guards/requirePlayerTurn";
import { Unit } from "../POO/classes/Units/Unit";
import { Hero } from "../POO/classes/Units/Hero";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { MonsterCategory } from "../POO/enums/Categories/MonsterCategory";
import { EffectService } from "../services/EffectService";
import { canMove, getPositionAfterMove } from "../services/MovementService";

function registerMovementHandlers(
    socket: Socket,
    io: Server<ServerToClientEvents, ClientToServerEvents>,
    gameService: GameService,
) {
    socket.on(
        "move-unit-one-step",
        (
            data: { gameId: string; unitId: string; direction: Direction },
            callback: (response: { success: boolean; error?: string }) => void,
        ) => {
            if (!requireGameExistsGameService(data.gameId, gameService)) {
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

            let unitMoved: Unit<HeroCategory | MonsterCategory> | undefined;
            if (isGameMaster) {
                unitMoved = game?.gameState.getUnitById(data.unitId);
            } else {
                try {
                    unitMoved = game!.getCurrentHeroTurn();
                } catch {
                    console.error("couldn't get current hero turn");
                    return callback({
                        success: false,
                        error: "Impossible de récupérer le héros dont c'est le tour.",
                    });
                }
            }

            if (!unitMoved) {
                console.error("unit to move not found");
                return callback({
                    success: false,
                    error: "Unité à déplacer introuvable.",
                });
            }

            const moverPlayer = game!.players.get(socket.id);

            const position = game!.gameState.board.getPositionOfUnit(
                unitMoved.id,
            );
            if (!position) {
                console.error(
                    "position of unit couldn't be found in move-unit-one-step",
                );
                return callback({
                    success: false,
                    error: "La position de l'unité n'a pas été trouvée.",
                });
            }

            if (
                canMove(
                    game!.gameState.board,
                    position,
                    data.direction,
                    unitMoved,
                )
            ) {
                console.error(
                    "movement isn't valid",
                );
                return callback({
                    success: false,
                    error: "le mouvement n'est pas valide",
                });
            }
            const newPosition = getPositionAfterMove(position, data.direction);

            if (
                hasDoor(gameState.doors, position, data.direction) &&
                isPlayer(unit)
            ) {
                openDoor(
                    gameState.doors,
                    gameState.walls,
                    position,
                    data.direction,
                );
            }
            if (newPosition === position) {
                console.error(
                    "no movement SHOULD HANDLE THAT SO HERO DOESN4T LOSE HIS ACTION",
                );
                return callback({ success: false, error: "aucun mouvement" });
            }
            const tile = gameState.board[position.x]?.[position.y];
            const newTile = gameState.board[newPosition.x]?.[newPosition.y];

            if (!tile || !newTile) {
                console.error("tiles not found in board");
                return callback({
                    success: false,
                    error: "les tuiles n'ont pas été trouvées sur le plateau",
                });
            }

            gameState.entityPositions.set(unit.id, newPosition);
            gameState.positionEntities.set(positionKey(newPosition), unit.id);
            const oldPositionKey = { x: position.x, y: position.y };
            gameState.positionEntities.delete(positionKey(oldPositionKey));

            io.to(data.gameId).emit("game-state-update", {
                gameState: convertGameStateAsSendableGameState(gameState),
            });

            return callback({ success: true });
        },
    );
}
