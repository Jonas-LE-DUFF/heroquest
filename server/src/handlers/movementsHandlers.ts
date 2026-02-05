import { Socket } from "socket.io";
import { GameService } from "../services/GameService";
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
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import {
  withValidation,
  successResponse,
  errorResponse,
  moveUnitOneStepSchema,
} from "../validation";

function registerMovementHandlers(socket: Socket) {
  socket.on(
    "move-unit-one-step",
    withValidation(socket, moveUnitOneStepSchema, (socket, data, callback) => {
      const { gameId, unitId, direction } = data;

      if (!requireGameExists(gameId)) {
        return callback(errorResponse("La partie n'existe plus."));
      }

      if (!requirePlayerTurn(socket, GameService.getGame(gameId)!)) {
        return callback(errorResponse("Ce n'est pas votre tour."));
      }

      const game = GameService.getGame(gameId);
      const isGameMaster = game!.getGameMaster()?.id === socket.id;

      const unitMoved: Unit<HeroCategory | MonsterCategory> | null =
        getUnitToMove(game!, unitId, isGameMaster);

      if (!unitMoved) {
        return callback(errorResponse("L'unité à déplacer est introuvable."));
      }

      const position: Position | null = game!.gameState.board.getPositionOfUnit(
        unitMoved?.id,
      );

      if (!position) {
        console.error(
          "position of unit couldn't be found in move-unit-one-step",
        );
        return callback(
          errorResponse("La position de l'unité n'a pas été trouvée."),
        );
      }

      const board: Board = game!.gameState.board;

      moveUnit(board, position, direction, unitMoved);

      handleDoorOpening(board, position, direction);

      const io = ServerHeroQuest.getServerInstance().getIo();

      io.to(gameId).emit("game-state-update", {
        game: game!.toJson(),
      });

      callback(successResponse());
    }),
  );
}

export { registerMovementHandlers };
