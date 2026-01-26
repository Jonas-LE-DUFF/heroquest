import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { FightDiceFaces } from "../../enums/Dices/FightDiceFaces";
import { StatType } from "../../enums/Effects/StatType";
import { EffectService } from "../../../services/EffectService";
import { Equipment } from "../Equipment/Equipment";
import { Stats } from "./Stats";
import { Unit } from "./Unit";
import { Spell } from "../Spell/Spell";
import { SpellElement } from "../../enums/SpellElement";

class Hero extends Unit<HeroCategory> {
    
    DefenseDiceType = FightDiceFaces.WhiteShield;
    
    equipment: Equipment;

    spells: Spell[] = [];
    usedSpells: Spell[] = [];

    constructor(controlledById: string, name: string, category: HeroCategory, stats: Stats, equipment: Equipment) {
        super(controlledById, name, category, stats);
        this.equipment = equipment;
    }
    
    getDefenseDiceCount(): number {
        const armorDefense = this.equipment.getDefenseTotalValue();
        const baseDefense = armorDefense + this.stats.nbDefenseDice;
        
        const modifier = EffectService.getStatModifier(this, StatType.DEFENSE);
        const multiplier = EffectService.getStatMultiplier(this, StatType.DEFENSE);
        
        return Math.floor((baseDefense + modifier) * multiplier);
    }

    getAttackDiceCount(): number {
        const weaponAttack = this.equipment.getDamageOfSelectedWeapon();
        
        const modifier = EffectService.getStatModifier(this, StatType.ATTACK);
        const multiplier = EffectService.getStatMultiplier(this, StatType.ATTACK);
        
        return Math.floor((weaponAttack + modifier) * multiplier);
    }

    getMovementPoints(): number {
        const debuff = this.equipment.getMovementDebuff();
        const baseMovement = this.stats.movements - debuff;
        
        const modifier = EffectService.getStatModifier(this, StatType.MOVEMENT);
        const multiplier = EffectService.getStatMultiplier(this, StatType.MOVEMENT);
        
        return Math.floor((baseMovement + modifier) * multiplier);
    }

    validateStats(): {sucess: boolean; error?: string} {
        // Ensure all stats are non-negative integers
        for (const value of Object.values(this.stats)) {
            if (value < 0) {
                return { sucess: false, error: "Stats cannot be negative" };
            }
        }

        if (this.stats.health > this.stats.maxHealth) {
            return { sucess: false, error: "Health cannot exceed max health" };
        }

        if (this.category === HeroCategory.Cleric) {
            if(this.spells.length !== 9) {
                return { sucess: false, error: "Cleric must have 9 spells" };
            }
        } 
        if (this.category === HeroCategory.Elf) {
            if(this.spells.length !== 3) {
                return { sucess: false, error: "Elf must have 3 spells" };
            }   
        }

        return { sucess: true };
    }

    // -- spells
    setSpells(spells: Spell[]): void {
        this.spells = spells;
    }

    useSpell(spell: Spell): void {
        this.usedSpells.push(spell);
    }

    unuseSpell(spell: Spell): void {
        this.usedSpells = this.usedSpells.filter(s => s !== spell);
    }

    getSpellsByElement(element: SpellElement): Spell[] {
        return this.spells.filter(spell => spell.element === element);
    }

    endTurnEffects() {
        this.effects = this.effects.filter(effect => {
            return !effect.durationTick();
        });
    }
}

export { Hero };