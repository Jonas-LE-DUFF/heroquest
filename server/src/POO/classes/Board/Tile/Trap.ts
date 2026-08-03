import { dealDamage } from "../../../../services/CombatService";
import { TrapType } from "../../../enums/Board/TrapType";
import { FightDiceFaces } from "../../../enums/Dices/FightDiceFaces";
import { PlayerRole } from "../../../enums/PlayerRole";
import { Hero } from "../../Units/Hero";
import { Unit } from "../../Units/Unit";
import { HeroCategory } from "../../../enums/Categories/HeroCategory";
import { MonsterCategory } from "../../../enums/Categories/MonsterCategory";
import { StatType } from "../../../enums/Effects/StatType";
import { EffectType } from "../../../enums/Effects/EffectType";
import { Effect } from "../../Effects/Effects";
import { EffectDuration } from "../../../enums/Effects/EffectDuration";
import { GameService } from "../../../../services/GameService";
import { TrapAsJson } from "../../../interfaces/ClassAsJson/Board/Tile/TrapAsJson";
import { DiceServiceRegistry } from "../../../../services/DiceServiceRegistry";
import { Direction } from "../../../enums/Direction";

abstract class Trap {
  protected readonly gameId: string;
  protected canBeTriggeredMultipleTimes: boolean = false;
  public isRevealed: boolean;
  public hasBeenTriggered: boolean;

  constructor(gameId: string) {
    this.gameId = gameId;
    this.isRevealed = false;
    this.hasBeenTriggered = false;
  }

  public walkOnTrap(target: Unit<HeroCategory | MonsterCategory>): void {
    if (this.isRevealed && target.getRole() === PlayerRole.HERO) {
      if (this.jumpAboveTrap(target as Hero)) {
        return;
      }
    }
    if (!(target instanceof Hero)) {
      //monster don't trigger traps, only heroes do
      return;
    }

    //doing this before triggering the trap to make sure that if the trap kills the hero, we still remove the trap from the tile if it can't be triggered multiple times
    if (!this.canBeTriggeredMultipleTimes) {
      const game = GameService.getGame(this.gameId);
      if (!game) {
        throw new Error("Game not found in trap walkOnTrap");
      }
      const position = game.gameState.board.getPositionOfUnit(target.id);
      if (!position) {
        throw new Error("Position not found for unit in trap walkOnTrap");
      }
      const tile = game.gameState.board.getTileAtPosition(position);
      if (!tile) {
        throw new Error("Tile not found on board in trap walkOnTrap");
      }
      tile.trap = null; // removing the trap from the tile after it's been triggered if it can't be triggered multiple times
    }

    this.trigger(target);
    this.hasBeenTriggered = true;
    this.isRevealed = true;
  }

  private jumpAboveTrap(target: Hero): boolean {
    const dice = DiceServiceRegistry.get();
    const result = dice.rollDice({
      gameId: this.gameId,
      wishedNumberOfDices: 1,
      playerId: target.controlledByPlayerId,
      kind: "fight",
    });
    if (!result.success || !result.results) {
      throw new Error(result.error || "Failed to roll fight dice");
    }
    if (result.results[0] === FightDiceFaces.Hit) {
      return false;
    }
    return true;
  }
  abstract trigger(target: Hero): void;

  abstract getTrapType(): TrapType;

  toJson(): TrapAsJson {
    return {
      type: this.getTrapType(),
      isRevealed: this.isRevealed,
      hasBeenTriggered: this.hasBeenTriggered,
    };
  }
}

class PitTrap extends Trap {
  canBeTriggeredMultipleTimes = true;

  trigger(target: Hero): void {
    dealDamage(this.gameId, target, 1);
    if (target.effects.some((effect) => effect.name === "Pit Trap")) {
      return; // if the hero already has the pit trap effect, we don't apply it again
    }
    target.addEffect(
      new Effect(
        "Pit Trap",
        EffectType.STAT_MODIFIER,
        EffectDuration.PERMANENT,
        true,
        { stat: StatType.ATTACK, value: -1 },
      ),
    );
    target.addEffect(
      new Effect(
        "Pit Trap",
        EffectType.STAT_MODIFIER,
        EffectDuration.PERMANENT,
        true,
        { stat: StatType.DEFENSE, value: -1 },
      ),
    );
    return; // if the hero already has the pit trap effect, we don't apply it again
  }

  getTrapType() {
    return TrapType.PIT_TRAP;
  }
}

class RockTrap extends Trap {
  canBeTriggeredMultipleTimes = false;

  trigger(target: Hero): void {
    const dice = DiceServiceRegistry.get();
    const diceResult = dice.rollDice({
      gameId: this.gameId,
      wishedNumberOfDices: 3,
      playerId: target.controlledByPlayerId,
      kind: "fight",
    });

    if (!diceResult.success || !diceResult.results) {
      throw new Error(diceResult.error || "Failed to roll fight dice");
    }
    const numberOfHits = diceResult.results.filter(
      (face) => face === FightDiceFaces.Hit,
    ).length;

    // placing a wall on the tile of the trap before dealing damage triggering it
    const game = GameService.getGame(this.gameId);
    if (!game) {
      throw new Error("Game not found in rock trap trigger");
    }
    const position = game.gameState.board.getPositionOfUnit(target.id);
    if (!position) {
      throw new Error("Position not found for unit in rock trap trigger");
    }
    game.gameState.board.placeFurniture("cobbleStone", position, Direction.UP); // placing a wall on the tile of the trap before dealing damage triggering it

    // dealing damage after placing the wall to make sure that if the trap kills the hero, we still place the wall on the tile
    dealDamage(this.gameId, target, numberOfHits);
  }

  getTrapType() {
    return TrapType.ROCK_TRAP;
  }
}

class SpearTrap extends Trap {
  canBeTriggeredMultipleTimes = false;

  trigger(target: Hero): void {
    const dice = DiceServiceRegistry.get();
    const diceResult = dice.rollDice({
      gameId: this.gameId,
      wishedNumberOfDices: 1,
      playerId: target.controlledByPlayerId,
      kind: "fight",
    });
    if (!diceResult.success || !diceResult.results) {
      throw new Error(diceResult.error || "Failed to roll fight dice");
    }
    const numberOfHits = diceResult.results.filter(
      (face) => face === FightDiceFaces.Hit,
    ).length;
    dealDamage(this.gameId, target, numberOfHits);
  }

  getTrapType() {
    return TrapType.SPEAR_TRAP;
  }
}

export { PitTrap, RockTrap, SpearTrap, Trap };
