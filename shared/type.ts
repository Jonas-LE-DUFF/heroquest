// Types de base
export interface Position {
  x: number;
  y: number;
}

export enum diceFace {
  "WhiteShield",
  "BlackShield",
  "Hit",
}

export type PlayerRole = "hero" | "game-master";

export interface Unit {
  health: number;
  maxHealth: number;
  spiritStats: number;
  nbAttackDice: number;
  nbDefenseDice: number;
  position: Position;
}

export interface Player {
  id: string;
  characterName?: string;
  class?: "Barbare" | "Nain" | "Elfe" | "Clerc";
  role: PlayerRole;
  stats?: Unit;
  ready: boolean;
}

export enum monsterClass {
  "Goblin",
  "Squelette",
  "Zombie",
  "Orc",
  "Abomination",
  "Momie",
  "Guerrier de la terreur",
  "Gargouille",
}

export interface Monster {
  id: string;
  class: monsterClass;
  stats: Unit;
  movements: number;
}

export enum tileType {
  "empty",
  "wall",
  "treasure",
  "trap",
  "start",
  "hero",
  "monster",
  "furniture",
}

export interface Tile {
  type: tileType;
  revealed: boolean;
  entityId?: string;
}

// Événements Socket.io
export interface ServerToClientEvents {
  // Réponses de connexion
  "join-success": (data: { playerId: string; game: SendableGameState }) => void;
  "join-error": (message: string) => void;

  "player-reconnected": (data: { playerId: string }) => void;

  // Mises à jour de jeu
  "game-state-update": (data: { gameState: SendableGameState }) => void;
  "dice-update": (data: { listResults: diceFace[] }) => void;
  "game-start": (data: { gameState: SendableGameState }) => void;

  // Actions spécifiques
  "unit-moved": (data: { playerId: string; newPosition: Position }) => void;
  "monster-spawned": (data: {
    monsterType: string;
    position: Position;
  }) => void;

  // Erreurs
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  "join-game": (data: {
    gameId: string;
    playerName: string;
    role: PlayerRole;
  }) => void;

  //player actions
  //lobby actions
  "player-ready": (data: { gameId: string; ready: boolean }) => void;
  //in-game actions
  "move-player": (data: {
    gameId: string;
    playerMoved: Player;
    newPosition: Position;
  }) => void;
  "attack-monster": (data: { gameId: string; monsterId: string }) => void;
  "cast-spell": (data: { gameId: string; targetId: string }) => void;
  "check-for-treasures": (data: { gameId: string; position: Position }) => void;
  "check-traps": (data: { gameId: string; postion: Position }) => void;
  "check-secret-doors": (data: { gameId: string; postion: Position }) => void;
  "disarm-trap": (data: { gameId: string; trapTargeted: Position }) => void;

  //game master actions
  //lobby actions
  "start-game": (data: { gameId: string }) => void;
  //in-game actions
  "spawn-monster": (data: {
    gameId: string;
    monsterClass: monsterClass;
    position: Position;
  }) => void;
  //in-turn actions
  "move-monster": (data: {
    gameId: string;
    monsterMoved: Monster;
    newPosition: Position;
  }) => void;

  "place-element": (data: {
    gameId: string;
    position: Position;
    selectedType: tileType;
    playerId: string;
  }) => void;

  "roll-dice": (data: {
    gameId: string;
    playerId: string;
    numberOfDice: number;
  }) => void;

  "asking-for-game-state": (data: { gameId: string }) => void;
}

// État du jeu
export interface GameState {
  id: string;
  board: Tile[][];
  players: Map<string, Player>; // Id -> Player
  monsters: Map<string, Monster>; // Id -> Monster
  entityPositions: Map<string, Position>; // entityId -> position
  positionEntities: Map<Position, string>; // "x,y" -> entityId

  currentTurn: string; // the id of the player
  status: "waiting" | "playing" | "finished";
}

export interface SendableGameState {
  id: string;
  board: Tile[][];
  players: Player[]; // Id -> Player
  monsters: Monster[]; // Id -> Monster

  ids: string[]; // ids of the different units on the board
  positions: Position[]; // the different positions of the units on the board
  // the two arrays up here should be organized as the ids[0] => position[0] in order to remake the Map

  currentTurn: string; // the id of the player
  status: "waiting" | "playing" | "finished";
}

export interface SocketData {
  playerId: string;
  gameId: string;
  playerName: string;
}
