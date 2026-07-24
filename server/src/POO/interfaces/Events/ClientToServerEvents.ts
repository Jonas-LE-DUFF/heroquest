import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { MonsterCategory } from "../../enums/Categories/MonsterCategory";
import { Direction } from "../../enums/Direction";
import { PlayerRole } from "../../enums/PlayerRole";
import { SpellElement } from "../../enums/SpellElement";
import { TileType } from "../../enums/Board/TileType";
import { PositionAsJson } from "../ClassAsJson/PositionAsJson";
import { GameAsJson } from "../ClassAsJson/Server/GameAsJson";
import { StatsAsJson } from "../ClassAsJson/Unit/StatsAsJson";

interface ClientToServerEvents {
  //login actions
  "join-game": (
    data: {
      gameName: string;
      playerName: string;
      role: PlayerRole;
    },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;

  // ############ hero actions ################
  // lobby actions
  "leave-game": (
    data: { gameId: string },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  "choose-character": (
    data: {
      gameId: string;
      playerId: string;
      heroType: HeroCategory;
      spells: SpellElement[];
    },
    callback: (response: {
      success: boolean;
      error?: string;
      gameState?: GameAsJson;
    }) => void,
  ) => void;

  "unselect-character": (
    data: { gameId: string; heroId: string; playerId: string },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;

  // in-game actions
  "select-weapon": (
    data: { gameId: string; playerId: string },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  attack: (
    data: { gameId: string; monsterId: string; playerId: string },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  "cast-spell": (
    data: {
      gameId: string;
      playerId: string;
      spellId: string;
      position: PositionAsJson;
    },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  "check-for-treasures": (data: {
    gameId: string;
    heroId: string;
    playerId: string;
  }) => void;
  "check-traps": (data: {
    gameId: string;
    heroId: string;
    playerId: string;
  }) => void;
  "check-secret-doors": (data: {
    gameId: string;
    heroId: string;
    playerId: string;
  }) => void;
  "disarm-trap": (data: {
    gameId: string;
    trapTargeted: PositionAsJson;
    playerId: string;
  }) => void;

  // ############################ game master actions ############################
  // lobby actions
  "start-game": (
    data: { gameId: string; playerId: string },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  // in-turn actions
  "move-unit-one-step": (
    data: {
      gameId: string;
      unitId: string;
      direction: Direction;
      playerId: string;
    },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;

  "place-element": (
    data: {
      gameId: string;
      position: PositionAsJson;
      selectedType: TileType | Direction | MonsterCategory;
      playerId: string;
    },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;

  "authorize-special-throw-dices": (
    data: {
      gameId: string;
      playerId: string;
      numberOfDices: number;
      typeOfDices: "red" | "fight";
      playerClass: HeroCategory;
    },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;

  "update-stats-unit": (
    data: {
      gameId: string;
      playerId: string;
      newStats: StatsAsJson;
      position: PositionAsJson;
    },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;

  "roll-dice": (
    data: {
      gameId: string;
      playerId: string;
      numberOfDice: number;
      kind: "red" | "fight";
    },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;

  "provide-roll-vector": (
    data: {
      gameId: string;
      vector: { x: number; y: number; z: number };
      boost: number;
    },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;

  "end-turn": (
    data: { gameId: string; playerId: string },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
}

export type { ClientToServerEvents };
