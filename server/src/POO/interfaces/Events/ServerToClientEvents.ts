import { FightDiceFaces } from "../../enums/Dices/FightDiceFaces";
import { TileType } from "../../enums/TileType";
import { GameAsJson } from "../ClassAsJson/Server/GameAsJson";
import { StatsAsJson } from "../ClassAsJson/Unit/StatsAsJson";
import { PositionAsJson } from "../ClassAsJson/PositionAsJson";
import { PlayerRole } from "../../enums/PlayerRole";

// Événements Socket.io
interface ServerToClientEvents {
  // connection responses
  "join-success": (data: { playerId: string; game: GameAsJson }) => void;

  "player-reconnected": (data: { playerId: string }) => void;

  // game-state updates
  "game-state-update": (data: { game: GameAsJson }) => void; // very slow and expensive, use only when necessary

  "dice-update": (data: {
    listResults: FightDiceFaces[];
    role: PlayerRole;
  }) => void;

  "red-dice-update": (data: {
    listResults: number[];
    role: PlayerRole;
  }) => void;

  //lobby actions
  "game-start": (data: { game: GameAsJson }) => void;

  "special-authorization": (data: {
    playerId: string;
    amountOfDices: number;
    typeOfDices: "red" | "fight";
  }) => void;

  // specific in-game actions
  "unit-moved": (data: {
    playerId: string;
    newPosition: PositionAsJson;
  }) => void;
  "monster-spawned": (data: {
    monsterType: string;
    position: PositionAsJson;
  }) => void;
  "door-placed": (data: {
    position: PositionAsJson;
    verticalOrHorizontal: "vertical" | "horizontal";
  }) => void;
  "tile-placed": (data: {
    position: PositionAsJson;
    TileType: TileType;
  }) => void;

  "stats-updated": (data: { entityId: string; newStats: StatsAsJson }) => void;

  // errors
  error: (message: string) => void;
}

export type { ServerToClientEvents };
