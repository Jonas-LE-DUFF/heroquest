// Types de base
export interface Position {
  x: number;
  y: number;
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

export interface Monster {
  id: string;
  type:
    | "Goblin"
    | "Squelette"
    | "Zombie"
    | "Orc"
    | "Abomination"
    | "Momie"
    | "Guerrier de la terreur"
    | "Gargouille";
  stats: Unit;
}

export interface Tile {
  type: "empty" | "wall" | "treasure" | "trap" | "start";
  revealed: boolean;
}

// Événements Socket.io
export interface ServerToClientEvents {
  // Réponses de connexion
  "join-success": (data: { gameState: GameState; playerId: string }) => void;
  "join-error": (message: string) => void;

  // Mises à jour de jeu
  "game-state-update": (gameState: GameState) => void;
  "lobby-update": (data: { players: Player[] }) => void;
  "game-start": (gameState: GameState) => void;

  // Actions spécifiques
  "player-moved": (data: { playerId: string; newPosition: Position }) => void;
  "monster-spawned": (data: {
    monsterType: string;
    position: Position;
  }) => void;

  // Erreurs
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  "join-game": (gameId: string, playerName: string, role: PlayerRole) => void;

  //player actions
  //lobby actions
  "player-ready": (gameId: string, ready: boolean) => void;
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
  "start-game": (gameId: string) => void;
  //in-game actions
  "spawn-monster": (data: {
    gameId: string;
    monsterType: Monster["type"];
    position: Position;
  }) => void;
  //in-turn actions
  "move-monster": (data: {
    gameId: string;
    monsterMoved: Monster;
    newPosition: Position;
  }) => void;
}

// État du jeu
export interface GameState {
  id: string;
  players: Player[];
  monsters: Monster[];
  board: Tile[][];
  currentTurn?: string; // the id of the player
  status: "waiting" | "playing" | "finished";
}

export interface SocketData {
  playerId: string;
  gameId: string;
  playerName: string;
}
