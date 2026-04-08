import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { MonsterCategory } from "../../enums/Categories/MonsterCategory";
import { FightDiceFaces } from "../../enums/Dices/FightDiceFaces";
import { AbilityType } from "../../enums/AbilityType";
import { Effect } from "../Effects/Effects";
import { EffectService } from "../../../services/EffectService";
import { Stats } from "./Stats";
import { randomUUID } from "crypto";
import { PlayerRole } from "../../enums/PlayerRole";
import { MonsterAsJson } from "../../interfaces/ClassAsJson/Unit/MonsterAsJson";
import { HeroAsJson } from "../../interfaces/ClassAsJson/Unit/HeroAsJson";

abstract class Unit<T extends HeroCategory | MonsterCategory> {
    id: string;
    controlledByPlayerId: string;
    name: string;
    category!: T;
    stats!: Stats;
    effects: Effect[] = [];

    abstract DefenseDiceType: FightDiceFaces; // the dice value that is needed to block damages

    constructor(
        controlledByPlayerId: string,
        name: string,
        category: T,
        stats: Stats,
    ) {
        this.id = randomUUID();
        this.controlledByPlayerId = controlledByPlayerId;
        this.name = name;
        this.category = category;
        this.stats = stats;
    }

    abstract getDefenseDiceCount(): number;

    abstract getAttackDiceCount(): number;

    abstract getMovementPoints(): number;

    endTurnEffects(): void {
        this.effects = this.effects.filter((effect) => {
            return !effect.durationTick();
        });
    }

    /**
     * this method should be overridden by subclasses to implement specific stat validation logic
     */
    protected abstract validateStatsImplementation(): {
        success: boolean;
        error?: string;
    };

    /**
     * shouldn't be overridden
     * @returns an object saying if the stats are validated or not : if not it gives the reason
     */
    validateStats(): { success: boolean; error?: string } {
        // Ensure all stats are non-negative integers
        for (const value of Object.values(this.stats)) {
            if (value < 0) {
                return { success: false, error: "Stats cannot be negative" };
            }
        }
        if (this.stats.health > this.stats.maxHealth) {
            return { success: false, error: "Health cannot exceed max health" };
        }
        return this.validateStatsImplementation();
    }

    getCategory(): T {
        return this.category;
    }

    abstract getRole(): PlayerRole;

    // -- effects
    addEffect(effect: Effect): void {
        this.effects.push(effect);
    }

    removeEffect(effect: Effect): void {
        this.effects = this.effects.filter((e) => e !== effect);
    }

    removeEffectByName(effectName: string): void {
        this.effects = this.effects.filter((e) => e.name !== effectName);
    }

    clearEffects(): void {
        this.effects = [];
    }

    // -- ability checks (delegated to EffectService)
    hasAbility(ability: AbilityType): boolean {
        return EffectService.hasAbility(this, ability);
    }

    canPhaseThroughWalls(): boolean {
        return EffectService.canPhaseThroughWalls(this);
    }

    canPhaseThroughMonsters(): boolean {
        return EffectService.canPhaseThroughMonsters(this);
    }

    abstract toJson(gameMaster: boolean): HeroAsJson | MonsterAsJson;

}

export { Unit };
