import { FightDiceFaces } from "../../enums/Dices/FightDiceFaces";
import { TileType } from "../../enums/TileType";
import { GameAsJson } from "../ClassAsJson/Server/GameAsJson";
import { StatsAsJson } from "../ClassAsJson/Unit/StatsAsJson";
import { PositionAsJson } from "../ClassAsJson/PositionAsJson";

// Événements Socket.io
interface ServerToClientEvents {
  // connection responses
  "join-success": (data: { playerId: string; game: GameAsJson }) => void;

  "player-reconnected": (data: { playerId: string }) => void;

  // game-state updates
  "game-state-update": (data: { game: GameAsJson }) => void; // very slow and expensive, use only when necessary
  
  "dice-update": (data: {
    listResults: FightDiceFaces[];
    role: "hero" | "game-master";
  }) => void;

  "red-dice-update": (data: {
    listResults: number[];
    role: "hero" | "game-master";
  }) => void;

  //lobby actions
  "game-start": (data: { game: GameAsJson }) => void;

  "special-authorization": (data: {
    playerId: string;
    amountOfDices: number;
    typeOfDices: "red" | "fight";
  }) => void;

  // specific in-game actions
  "unit-moved": (data: { playerId: string; newPosition: PositionAsJson }) => void;
  "monster-spawned": (data: {
    monsterType: string;
    position: PositionAsJson;
  }) => void;
  "door-placed": (data: {
    position: PositionAsJson;
    verticalOrHorizontal: "vertical" | "horizontal";
  }) => void;
  "tile-placed": (data: { position: PositionAsJson; tileType: TileType }) => void;

  "stats-updated": (data: {
    entityId: string;
    newStats: StatsAsJson;
    isHero: boolean;
  }) => void;

  // errors
  error: (message: string) => void;
}

export type { ServerToClientEvents };