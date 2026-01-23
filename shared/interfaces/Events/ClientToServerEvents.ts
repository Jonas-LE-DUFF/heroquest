import { GameState } from "../../classes/GameState";
import { Position } from "../../classes/Position/Position";
import { Unit } from "../../classes/Units/Unit";
import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { MonsterCategory } from "../../enums/Categories/MonsterCategory";
import { Direction } from "../../enums/Direction";
import { PlayerRole } from "../../enums/PlayerRole";
import { SpellElement } from "../../enums/SpellElement";

interface ClientToServerEvents {
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
      heroType: HeroCategory;
      spells: SpellElement[];
    },
    callback: (response: {
      success: boolean;
      error?: string;
      gameState?: GameState;
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
    selectedType: TileType | Direction | MonsterCategory;
    playerId: string;
  }) => void;

  "authorize-special-throw-dices": (data: {
    gameId: string;
    numberOfDices: number;
    typeOfDices: "red" | "fight";
    playerClass: HeroCategory;
  }) => void;

  "update-stats-unit": (
    data: {
      gameId: string;
      newStats: Unit<HeroCategory | MonsterCategory>;
      position: Position;
    },
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;

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

export { ClientToServerEvents };