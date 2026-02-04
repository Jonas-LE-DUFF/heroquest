import { EffectFactory } from "../POO/classes/Effects/Effects";
import { ApplyEffectSpellEffect } from "../POO/classes/Spell/ApplyEffectSpellEffect";
import { FireAttackSpellEffect } from "../POO/classes/Spell/FireAttackSpellEffect";
import { HealSpellEffect } from "../POO/classes/Spell/HealSpellEffect";
import { SpecialSpellEffect } from "../POO/classes/Spell/SpecialSpellEffect";
import { Spell } from "../POO/classes/Spell/Spell";
import { SpellElement } from "../POO/enums/SpellElement";

function getSpellsForElements(gameId: string, spellElements: SpellElement[]): Spell[] {
    const allSpells = getAllSpells(gameId);
    return allSpells.filter(spell => spellElements.includes(spell.element));
}

function getAllSpells(gameId:string): Spell[] {
    // This function would normally fetch spells from a database or define them here.
    // For demonstration, we will return a static list of spells.
    return [
        new Spell("Djinn", "Djinn", SpellElement.Air, new SpecialSpellEffect(), ["none"]),
        new Spell("Quick_as_the_wind", "Vif comme le vent", SpellElement.Air, new ApplyEffectSpellEffect(EffectFactory.createSwift()), ["hero", "self"]),
        new Spell("Tornado", "Tornade", SpellElement.Air, new ApplyEffectSpellEffect(EffectFactory.createTornado()), ["enemy"]),

        new Spell("Heal", "Guérison", SpellElement.Earth, new HealSpellEffect(4), ["hero", "self"]),
        new Spell("RockSkin", "Peau de roc", SpellElement.Earth, new ApplyEffectSpellEffect(EffectFactory.createRockSkin()), ["hero", "self"]),
        new Spell("Through_the_rock", "À travers la pierre", SpellElement.Earth, new ApplyEffectSpellEffect(EffectFactory.createPhaseThroughWalls()), ["hero", "self"]),

        new Spell("Courage", "Courage", SpellElement.Fire, new ApplyEffectSpellEffect(EffectFactory.createCourage()), ["enemy"]),
        new Spell("Fire_of_wrath", "Le feu du couroux", SpellElement.Fire, new FireAttackSpellEffect(gameId, 1), ["enemy"]),
        new Spell("FIREBAALL", "Boule de feu", SpellElement.Fire, new FireAttackSpellEffect(gameId, 2), ["enemy"]),

        new Spell("Sleep", "Sommeil", SpellElement.Water, new ApplyEffectSpellEffect(EffectFactory.createSleep()), ["enemy"]),
        new Spell("Veil_of_mist", "Voile de brume", SpellElement.Water, new ApplyEffectSpellEffect(EffectFactory.createPhaseThroughMonsters()), ["hero", "self"]),
        new Spell("Water_heal", "Eau de Guérison", SpellElement.Water, new HealSpellEffect(4), ["hero", "self"]),
    ];
}

export { getSpellsForElements, getAllSpells };