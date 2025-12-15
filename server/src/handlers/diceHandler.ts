import { Server, Socket } from "socket.io";
import { grantSpecialRollAuthorization, rollFightDice, rollRedDice } from "../controllers/dicesControllers";
import { ClientToServerEvents, GameState, heroClass, ServerToClientEvents, SocketData } from "../shared/type";

export function handleSpecialRollAuthorization(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, SocketData, any>,
  games: Map<string, GameState>
) {
  socket.on(
    "authorize-special-throw-dices",
    (data: {
      gameId: string;
      numberOfDices: number;
      typeOfDices: "fight" | "red";
      playerClass: heroClass;
    }) => {
      grantSpecialRollAuthorization(
        games.get(data.gameId),
        socket,
        data.numberOfDices,
        data.typeOfDices,
        data.playerClass
      );
    }
  );
}

export function handleRollRedDice(
  io: Server<ClientToServerEvents, ServerToClientEvents, SocketData>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents, SocketData, any>,
  games: Map<string, GameState>
) {
  socket.on(
    "roll-red-dice",
    async (
      data: { gameId: string; currentNumberOfDices: number },
      callback
    ) => {
      const result = await rollRedDice(
        io,
        socket.id,
        games.get(data.gameId)!,
        data.currentNumberOfDices
      );
      return callback(result);
    }
  );
}

export function handleRollFightDice(
  io: Server<ClientToServerEvents, ServerToClientEvents, SocketData>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents, SocketData, any>,
  games: Map<string, GameState>
) {
  socket.on(
    "roll-dice",
    async (
      data: {
        gameId: string;
        playerId: string;
        numberOfDice: number;
      },
      callback: (response: { success: boolean; error?: string }) => void
    ) => {
      const gameState = games.get(data.gameId);
      rollFightDice(io, data.playerId, gameState!, data.numberOfDice);
      return callback({ success: true });
    }
  );
}