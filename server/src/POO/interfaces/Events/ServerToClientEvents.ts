import { Position } from "../../classes/Position/Position";
import { Game } from "../../classes/Server/Game";
import { Unit } from "../../classes/Units/Unit";
import { FightDiceFaces } from "../../enums/Dices/FightDiceFaces";
import { TileType } from "../../enums/TileType";

// Événements Socket.io
interface ServerToClientEvents {
  // connection responses
  "join-success": (data: { playerId: string; game: Game }) => void;

  "player-reconnected": (data: { playerId: string }) => void;

  // game-state updates
  "game-state-update": (data: { game: Game }) => void; // very slow and expensive, use only when necessary
  
  "dice-update": (data: {
    listResults: FightDiceFaces[];
    role: "hero" | "game-master";
  }) => void;

  "red-dice-update": (data: {
    listResults: number[];
    role: "hero" | "game-master";
  }) => void;

  //lobby actions
  "game-start": (data: { game: Game }) => void;

  "special-authorization": (data: {
    playerId: string;
    amountOfDices: number;
    typeOfDices: "red" | "fight";
  }) => void;

  // specific in-game actions
  "unit-moved": (data: { playerId: string; newPosition: Position }) => void;
  "monster-spawned": (data: {
    monsterType: string;
    position: Position;
  }) => void;
  "door-placed": (data: {
    position: Position;
    verticalOrHorizontal: "vertical" | "horizontal";
  }) => void;
  "tile-placed": (data: { position: Position; tileType: TileType }) => void;

  "stats-updated": (data: {
    entityId: string;
    newStats: Unit<any>;
    isPlayer: boolean;
  }) => void;

  // errors
  error: (message: string) => void;
}

export type { ServerToClientEvents };