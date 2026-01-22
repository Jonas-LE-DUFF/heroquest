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

export interface Player {
  id: string;
  class?: heroClass | undefined;
  role: PlayerRole;
  stats?: Unit | undefined;
  ready: boolean;
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
