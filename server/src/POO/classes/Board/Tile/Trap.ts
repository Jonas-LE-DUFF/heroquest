import { dealDamage } from "../../../../services/CombatService";
import { rollFightDice } from "../../../../services/DiceService";
import { TrapType } from "../../../enums/Board/TrapType";
import { FightDiceFaces } from "../../../enums/Dices/FightDiceFaces";
import { PlayerRole } from "../../../enums/PlayerRole";
import { Hero } from "../../Units/Hero";
import { Unit } from "../../Units/Unit";
import { HeroCategory } from "../../../enums/Categories/HeroCategory";
import { MonsterCategory } from "../../../enums/Categories/MonsterCategory";

abstract class Trap {
    protected readonly gameId: string;
    public isRevealed: boolean;
    public hasBeenTriggered: boolean;

    constructor(gameId: string) {
        this.gameId = gameId;
        this.isRevealed = false;
        this.hasBeenTriggered = false;
    }

    public walkOnTrap(target: Unit<HeroCategory | MonsterCategory>): void {
        if (this.hasBeenTriggered) {
            return;
        }
        this.hasBeenTriggered = true;
        this.isRevealed = true;
        if (target instanceof Hero) {
            // monsters never trigger traps
            this.trigger(target);
        }
    }
    
    abstract trigger(target: Hero): Promise<void>;

    abstract getTrapType(): TrapType;

    toJson() {
        return {
            type: this.getTrapType(),
            isRevealed: this.isRevealed,
            hasBeenTriggered: this.hasBeenTriggered,
        }
    }

}

class PitTrap extends Trap {

    async trigger(target: Hero): Promise<void> {
        dealDamage(this.gameId, target, 1);
    }

    getTrapType() {
        return TrapType.PIT_TRAP;
    }
}

class RockTrap extends Trap {

    async trigger(target: Hero): Promise<void> {
        const diceResult = await rollFightDice(this.gameId, 3, PlayerRole.HERO);
        if (!diceResult.success || !diceResult.results) {
            throw new Error(diceResult.error || "Failed to roll fight dice");
        }
        const numberOfHits = diceResult.results.filter(face => face === FightDiceFaces.Hit).length;            
        dealDamage(this.gameId, target, numberOfHits);
    }

    getTrapType() {
        return TrapType.ROCK_TRAP;
    }
}

class SpearTrap extends Trap {

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