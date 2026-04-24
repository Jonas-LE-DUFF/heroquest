import { dealDamage } from "../../../../services/CombatService";
import { rollFightDice } from "../../../../services/DiceService";
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
import { TileType } from "../../../enums/Board/TileType";
import { TrapAsJson } from "../../../interfaces/ClassAsJson/Board/TrapAsJson";

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

  public async walkOnTrap(
    target: Unit<HeroCategory | MonsterCategory>,
  ): Promise<void> {
    if (!this.canBeTriggeredMultipleTimes && this.hasBeenTriggered) return;
    if (target instanceof Hero) {
      // monsters never trigger traps
      await this.trigger(target);
      this.hasBeenTriggered = true;
      this.isRevealed = true;
    }
  }

  abstract trigger(target: Hero): Promise<void>;

  abstract getTrapType(): TrapType;

  toJson(gameMaster: boolean = false): TrapAsJson {
    return {
      type: this.getTrapType(),
      isRevealed: this.isRevealed,
      hasBeenTriggered: this.hasBeenTriggered,
    };
  }
}

class PitTrap extends Trap {
  canBeTriggeredMultipleTimes = true;

  async trigger(target: Hero): Promise<void> {
    dealDamage(this.gameId, target, 1);
    if(target.effects.some(effect => effect.name === "Pit Trap")) {
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
  }

  getTrapType() {
    return TrapType.PIT_TRAP;
  }
}

class RockTrap extends Trap {
  canBeTriggeredMultipleTimes = false;

  async trigger(target: Hero): Promise<void> {
    const diceResult = await rollFightDice(this.gameId, 3, PlayerRole.HERO);
    if (!diceResult.success || !diceResult.results) {
      throw new Error(diceResult.error || "Failed to roll fight dice");
    }
    const numberOfHits = diceResult.results.filter(
      (face) => face === FightDiceFaces.Hit,
    ).length;
    dealDamage(this.gameId, target, numberOfHits);

    // placing a wall on the tile of the trap after triggering it
    const game = GameService.getGame(this.gameId);
    if (!game) {
      throw new Error("Game not found in rock trap trigger");
    }

    const position = game.gameState.board.getPositionOfUnit(target.id);
    const tile = game.gameState.board.getTileAtPosition(position!);
    if (!tile) {
      throw new Error("Tile not found on board in rock trap trigger");
    }
    tile.type = TileType.WALL;
    tile.trap = null; // removing the trap from the tile since it's now a wall
  }

  getTrapType() {
    return TrapType.ROCK_TRAP;
  }
}

class SpearTrap extends Trap {
  canBeTriggeredMultipleTimes = false;

  async trigger(target: Hero): Promise<void> {
    const diceResult = await rollFightDice(this.gameId, 1, PlayerRole.HERO);
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
