import { dealDamage } from "../../../../services/CombatService";
import { rollFightDice } from "../../../../services/DiceService";
import { FightDiceFaces } from "../../../enums/Dices/FightDiceFaces";
import { PlayerRole } from "../../../enums/PlayerRole";
import { Hero } from "../../Units/Hero";

abstract class Trap {
    protected readonly gameId: string;
    public isRevealed: boolean;
    public hasBeenTriggered: boolean;

    constructor(gameId: string) {
        this.gameId = gameId;
        this.isRevealed = false;
        this.hasBeenTriggered = false;
    }

    private walkOnTrap(target: Hero): void {
        this.hasBeenTriggered = true;
        this.isRevealed = true;
        this.trigger(target);
    }
    
    abstract trigger(target: Hero): Promise<void>;

}

class PitTrap extends Trap {

    async trigger(target: Hero): Promise<void> {
        dealDamage(this.gameId, target, 1);
    }

    getTileType() {
        return "PIT_TRAP";
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
}

export { PitTrap, RockTrap, SpearTrap };