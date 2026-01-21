// Types de base
export interface Position {
  x: number;
  y: number;
}

export enum diceFace {
  WhiteShield = 1,
  BlackShield,
  Hit,
}

export enum monsterClass {
  Goblin = 100,
  Skeleton,
  Zombie,
  Orc,
  Abomination,
  Mummy,
  TerrorWarrior,
  Gargoyle,
}

export enum heroClass {
  Barbarian = 300,
  Dwarf,
  Elf,
  Cleric,
}

export enum spellElement {
  Fire = 400,
  Water,
  Earth,
  Air,
}

export enum tileType {
  empty = 200,
  wall,
  treasure,
  trap,
  start,
  furniture,
}

export enum Direction {
  UP = "up",
  DOWN = "down",
  LEFT = "left",
  RIGHT = "right",
}

export type PlayerRole = "hero" | "game-master";

export interface Status {
  effectName: string;
  duration: string;
  relatedSpell: string; // the spell that caused this status effect
}

export interface Unit {
  hp?: number | undefined;
  maxHp?: number | undefined;
  spiritPoints?: number | undefined;
  nbAttackDice?: number | undefined;
  nbDefenseDice?: number | undefined;
  name: string;
  movements?: number | undefined;
  spells?: spellElement[] | undefined;
  usedSpells?: string[] | undefined;
  gold?: number | undefined;
  equipments?: string[] | undefined;
  statusEffects: (Status | null)[] | undefined; // the effects obtained by spells or potions
}

export interface Player {
  id: string;
  class?: heroClass | undefined;
  role: PlayerRole;
  stats?: Unit | undefined;
  ready: boolean;
}

export interface Monster {
  id: string;
  class: monsterClass;
  stats: Unit;
}

export interface WallGrid {
  horizontal: boolean[][]; // walls between the tiles horizontally
  vertical: boolean[][]; // walls between the tiles vertically
}

export interface DoorGrid {
  horizontal: boolean[][]; // doors between the tiles horizontally
  vertical: boolean[][]; // doors between the tiles vertically
}

// Événements Socket.io
export interface ServerToClientEvents {
  // connection responses
  //TODO : remove join error and use callbacks instead
  "join-success": (data: { playerId: string; game: SendableGameState }) => void;
  "join-error": (message: string) => void;

  "player-reconnected": (data: { playerId: string }) => void;

  // game-state updates
  "game-state-update": (data: { gameState: SendableGameState }) => void; // very slow and expensive, use only when necessary
  "dice-update": (data: {
    listResults: diceFace[];
    role: "hero" | "game-master";
  }) => void;
  "red-dice-update": (data: {
    listResults: number[];
    role: "hero" | "game-master";
  }) => void;
  
  //lobby actions
  "game-start": (data: { gameState: SendableGameState }) => void;

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
  "tile-placed": (data: { position: Position; tileType: tileType }) => void;

  "stats-updated": (data: {
    entityId: string;
    newStats: Unit;
    isPlayer: boolean;
  }) => void;

  // errors
  error: (message: string) => void;
}
//////////////////////////////////////////////////////////////////////////////////
export interface ClientToServerEvents {
  //login actions
  "join-game": (data: {
    gameId: string;
    playerName: string;
    role: PlayerRole;
  }) => void;

  // ############ hero actions ################
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
  "cast-spell": (
    data: {
      gameId: string;
      spellId: string;
      position: Position;
    },
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;
  "check-for-treasures": (data: { gameId: string; position: Position }) => void;
  "check-traps": (data: { gameId: string; postion: Position }) => void;
  "check-secret-doors": (data: { gameId: string; postion: Position }) => void;
  "disarm-trap": (data: { gameId: string; trapTargeted: Position }) => void;

  // ############################ game master actions ############################
  // lobby actions
  "start-game": (data: { gameId: string }) => void;
  // in-turn actions
  "move-unit-one-step": (
    data: {
      gameId: string;
      unitId: string;
      direction: Direction;
    },
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;

  "place-element": (data: {
    gameId: string;
    position: Position;
    selectedType: tileType | Direction | monsterClass;
    playerId: string;
  }) => void;

  "authorize-special-throw-dices": (data: {
    gameId: string;
    numberOfDices: number;
    typeOfDices: "red" | "fight";
    playerClass: heroClass;
  }) => void;

  "update-stats-unit": (
    data: {
      gameId: string;
      newStats: Unit;
      position: Position;
    },
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;

  "attack" : (
    data: {
    gameId: string;
    attackerId: string;
    targetId: string;
    weaponId: string;
    },
    callback: (response: { success: boolean; damageDealt?: number; error?: string }) => void
  ) => void;

  // ###################### common actions ########################
  "roll-dice": (
    data: {
      gameId: string;
      playerId: string;
      numberOfDice: number;
    },
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;

  "roll-red-dice": (
    data: {
      gameId: string;
      currentNumberOfDices: number;
    },
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;

  "end-turn": (data: { gameId: string }) => void;
}

// État du jeu
export interface GameState {
  id: string;
  board: tileType[][];
  walls: WallGrid;
  doors: DoorGrid;
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
  board: tileType[][];
  walls: WallGrid;
  doors: DoorGrid;
  players: Player[]; // Id -> Player
  monsters: Monster[]; // Id -> Monster

  ids: string[]; // ids of the different units on the board
  positions: Position[]; // the different positions of the units on the board
  // the two arrays up here should be organized as the ids[0] => position[0] in order to remake the Map

  turnOrder: (string | undefined)[]; // order of turn with the ids of players; game master should always be last player
  currentTurn: string; // the id of the player
  status: "lobby" | "playing" | "finished";
}

export interface SocketData {
  playerId: string;
  gameId: string;
  playerName: string;
}
