import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { FightDiceFaces } from "../../enums/Dices/FightDiceFaces";
import { StatType } from "../../enums/Effects/StatType";
import { EffectService } from "../../../services/EffectService";
import { Equipment } from "../Equipment/Equipment";
import { Stats } from "./Stats";
import { Unit } from "./Unit";
import { Spell } from "../Spell/Spell";
import { SpellElement } from "../../enums/SpellElement";
import { PlayerRole } from "../../enums/PlayerRole";
import { HeroAsJson } from "../../interfaces/ClassAsJson/Unit/HeroAsJson";

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

    validateStatsImplementation(): {success: boolean; error?: string} {
        if (this.category === HeroCategory.Cleric) {
            if(this.spells.length !== 9) {
                return { success: false, error: "Cleric must have 9 spells" };
            }
        } 
        if (this.category === HeroCategory.Elf) {
            if(this.spells.length !== 3) {
                return { success: false, error: "Elf must have 3 spells" };
            }   
        }

        return { success: true };
    }

    // -- spells
    setSpells(spells: Spell[]): void {
        this.spells = spells;
    }

    castSpell(spell: Spell, target: Unit<any>): void {
        spell.applyEffect(target);
        this.usedSpells.push(spell);
    }

    getSpellById(spellId: string): Spell | undefined {
        return this.spells.find(spell => spell.id === spellId);
    }

    unuseSpell(spell: Spell): void {
        this.usedSpells = this.usedSpells.filter(s => s !== spell);
    }

    getSpellsByElement(element: SpellElement): Spell[] {
        return this.spells.filter(spell => spell.element === element);
    }

    getRole(): PlayerRole {
        return PlayerRole.HERO;
    }

    toJson(): HeroAsJson {
        return {
            id: this.id,
            controlledByPlayerId: this.controlledByPlayerId,
            name: this.name,
            category: HeroCategory[this.category],
            stats: {
                health: this.stats.health,
                maxHealth: this.stats.maxHealth,
                attack: this.getAttackDiceCount(),
                defense: this.getDefenseDiceCount(),
                movements: this.getMovementPoints(),
                spirit: this.stats.spirit,
            },
            equipment: this.equipment.toJson(),
            spells: this.spells.map(spell => spell.toJson()),
        };
    }
}

export { Hero };