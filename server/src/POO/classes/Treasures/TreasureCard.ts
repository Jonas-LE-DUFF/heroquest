import { dealDamage } from "../../../services/CombatService";
import { Hero } from "../Units/Hero";
import { TreasurePotionFactory } from "../Equipment/Items/Potions";
import { TreasureCardAsJson } from "../../interfaces/ClassAsJson/Treasure/TreasureCardAsJson";

class TreasureCard {
  id: string;
  name: string;
  isPutBack: boolean;
  imgPath: string;
  originalAmountInDeck: number;
  effectName?: string | undefined;
  effectInfo?:
    | {
        amountOfDamage?: number;
        amountOfGold?: number;
        potionReference?: string;
      }
    | undefined;

  constructor(
    id: string,
    name: string,
    imgPath: string,
    originalAmountInDeck: number,
    effectName?: string,
    effectInfo?: {
      amountOfDamage?: number;
      amountOfGold?: number;
      potionReference?: string;
    },
  ) {
    this.id = id;
    this.name = name;
    this.isPutBack = false;
    this.imgPath = imgPath;
    this.originalAmountInDeck = originalAmountInDeck;
    this.effectName = effectName;
    this.effectInfo = effectInfo;
  }

  applyEffect(
    gameId: string,
    cardDrawer: Hero,
  ): { success: boolean; error?: string } {
    if (this.effectName?.includes("deal damage")) {
      dealDamage(gameId, cardDrawer, this.effectInfo?.amountOfDamage ?? 0);
      return { success: true };
    }
    if (this.effectName?.includes("spawns a monster that attacks")) {
      // TODO : implement this effect
      return { success: false, error: "manual interaction is required" };
    }
    if (this.effectName?.includes("gain gold")) {
      cardDrawer.equipment.gold += this.effectInfo?.amountOfGold ?? 0;
      return { success: true };
    }
    if (this.effectName?.includes("gain potion")) {
      const factory = new TreasurePotionFactory();
      cardDrawer.equipment.addPotion(
        factory.createPotionFromReference(
          this.effectInfo?.potionReference ?? "",
        ),
      );
      return { success: true };
    }
    return { success: false, error: "no effect implemented" };
  }

  toJson(): TreasureCardAsJson {
    return {
      id: this.id,
      name: this.name,
      imgPath: this.imgPath,
    };
  }
}

export { TreasureCard };
