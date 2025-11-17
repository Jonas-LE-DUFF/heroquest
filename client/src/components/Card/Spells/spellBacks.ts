import earth from "./../../../../public/assets/cards/spells/earth/back.png";
import fire from "./../../../../public/assets/cards/spells/fire/back.png";
import air from "./../../../../public/assets/cards/spells/wind/back.png";
import water from "./../../../../public/assets/cards/spells/water/back.png";
import { spellElement } from "../../../shared/type";

export function getSpellBackImagePath(spellBackName: spellElement): string {
  switch (spellBackName) {
    case spellElement.Earth:
      return earth;
    case spellElement.Fire:
      return fire;
    case spellElement.Air:
      return air;
    case spellElement.Water:
      return water;
    default:
      return "";
  }
}
