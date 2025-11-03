// Types de base
export interface Position {
  x: number;
  y: number;
}

export enum diceFace {
  "WhiteShield" = 1,
  "BlackShield",
  "Hit",
}

export enum heroClass {
  "Barbarian" = 1,
  "Dwarf",
  "Elf",
  "Cleric",
}

export enum spellElement {
  "Fire" = 1,
  "Water",
  "Earth",
  "Air",
}

export type PlayerRole = "hero" | "game-master";

export interface Unit {
  hp: number;
  maxHp: number;
  spiritPoints: number;
  nbAttackDice: number;
  nbDefenseDice: number;
}

export interface Player {
  id: string;
  characterName?: string;
  class?: heroClass | undefined;
  role: PlayerRole;
  stats?: Unit | undefined;
  ready: boolean;
  spells?: spellElement[] | undefined;
  gold?: number | undefined;
}

export enum monsterClass {
  Goblin = 1,
  Squelette,
  Zombie,
  Orc,
  Abomination,
  Momie,
  Guerrier_de_la_terreur,
  Gargouille,
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
  entityId?: string | undefined;
}

export interface WallGrid {
  horizontal: boolean[][]; // Murs entre les cases horizontalement
  vertical: boolean[][]; // Murs entre les cases verticalement
}

// Événements Socket.io
export interface ServerToClientEvents {
  // Réponses de connexion
  "join-success": (data: { playerId: string; game: SendableGameState }) => void;
  "join-error": (message: string) => void;

  "player-reconnected": (data: { playerId: string }) => void;

  // Mises à jour de jeu
  "game-state-update": (data: { gameState: SendableGameState }) => void;
  "dice-update": (data: {
    listResults: diceFace[];
    role: "hero" | "game-master";
  }) => void;
  "red-dice-update": (data: {
    listResults: number[];
    role: "hero" | "game-master";
  }) => void;
  "game-start": (data: { gameState: SendableGameState }) => void;

  "special-authorization": (data: {
    playerId: string;
    amountOfDices: number;
    typeOfDices: "red" | "fight";
  }) => void;

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

  // lobby actions
  "leave-lobby": (data: { gameId: string }) => void;
  "choose-character": (
    data: {
      gameId: string;
      playerId: string;
      heroType: heroClass;
      stats: Unit;
      spells: spellElement[];
    },
    callback: (response: {
      success: boolean;
      error?: string;
      gameState?: SendableGameState;
    }) => void
  ) => void; // Updated choose-character event definition

  "unselect-character": (data: { gameId: string }) => void;

  // in-game actions
  "move-player-one-step": (data: {
    gameId: string;
    playerId: string;
    direction: Direction;
  }) => void;
  "attack-monster": (data: { gameId: string; monsterId: string }) => void;
  "cast-spell": (data: { gameId: string; targetId: string }) => void;
  "check-for-treasures": (data: { gameId: string; position: Position }) => void;
  "check-traps": (data: { gameId: string; postion: Position }) => void;
  "check-secret-doors": (data: { gameId: string; postion: Position }) => void;
  "disarm-trap": (data: { gameId: string; trapTargeted: Position }) => void;

  // game master actions
  // lobby actions
  "start-game": (data: { gameId: string }) => void;
  // in-turn actions
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
    monsterType: monsterClass;
  }) => void;

  "roll-dice": (data: {
    gameId: string;
    playerId: string;
    numberOfDice: number;
  }) => void;

  "roll-red-dice": (data: { gameId: string }) => void;

  "end-turn": (data: { gameId: string }) => void;

  "authorize-special-throw-dices": (data: {
    gameId: string;
    numberOfDices: number;
    typeOfDices: "red" | "fight";
    playerClass: heroClass;
  }) => void;
}

// État du jeu
export interface GameState {
  id: string;
  board: Tile[][];
  walls: WallGrid;
  players: Map<string, Player>; // Id -> Player
  monsters: Map<string, Monster>; // Id -> Monster
  entityPositions: Map<string, Position>; // entityId -> position
  positionEntities: Map<string, string>; // "x,y" -> entityId

  turnOrder: (string | undefined)[]; // order of turn with the ids of players; game master should always be last player

  currentTurn: string; // the id of the player
  status: "lobby" | "playing" | "finished";
}

export interface SendableGameState {
  id: string;
  board: Tile[][];
  walls: WallGrid;
  players: Player[]; // Id -> Player
  monsters: Monster[]; // Id -> Monster

  ids: string[]; // ids of the different units on the board
  positions: Position[]; // the different positions of the units on the board
  // the two arrays up here should be organized as the ids[0] => position[0] in order to remake the Map

  turnOrder: (string | undefined)[]; // order of turn with the ids of players; game master should always be last player
  currentTurn: string; // the id of the player
  status: "lobby" | "playing" | "finished";
}

export enum Direction {
  UP = "up",
  DOWN = "down",
  LEFT = "left",
  RIGHT = "right",
}

export interface SocketData {
  playerId: string;
  gameId: string;
  playerName: string;
}
