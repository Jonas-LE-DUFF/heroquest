import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { MonsterCategory } from "../../enums/Categories/MonsterCategory";
import { SpellElement } from "../../enums/SpellElement";
import { SpellAsJson } from "../../interfaces/ClassAsJson/SpellAsJson";
import { Unit } from "../Units/Unit";
import { SpellEffect } from "./SpellEffect";

class Spell {
  id: string;
  name: string;
  element: SpellElement;
  effect: SpellEffect;
  target_type: string[];

  constructor(
    id: string,
    name: string,
    element: SpellElement,
    effect: SpellEffect,
    target_type: string[],
  ) {
    this.id = id;
    this.name = name;
    this.element = element;
    this.effect = effect;
    this.target_type = target_type;
  }

  applyEffect(target: Unit<MonsterCategory | HeroCategory>) {
    this.effect.applyEffect(target);
  }

  toJson(): SpellAsJson {
    return {
      id: this.id,
      name: this.name,
      element: this.element,
    };
  }
}

export { Spell };
