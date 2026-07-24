import { dealDamage } from "../../../services/CombatService";
import { Hero } from "../Units/Hero";
import { TreasurePotionFactory } from "../Equipment/Items/Potions";
import { CardAsJson } from "../../interfaces/ClassAsJson/CardAsJson";
import treasures from "../../../shared/game_cards/treasure.json";

export type TreasureCardEffectName =
  | "Deal damage and end turn"
  | "Spawns a monster that attacks"
  | "Gain gold"
  | "Gain potion";

class TreasureCard {
  id: string;
  name: string;
  isPutBack: boolean;
  imgPath: string;
  originalAmountInDeck: number;
  effectName?: TreasureCardEffectName | undefined;
  effectInfo?:
    | {
        amountOfDamage?: number;
        amountOfGold?: number;
        potionReference?: string;
      }
    | undefined;

  backImgPath = treasures.backImg;

  constructor(
    id: string,
    name: string,
    imgPath: string,
    originalAmountInDeck: number,
    isPutBack?: boolean,
    effectName?: TreasureCardEffectName,
    effectInfo?: {
      amountOfDamage?: number;
      amountOfGold?: number;
      potionReference?: string;
    },
  ) {
    this.id = id;
    this.name = name;
    this.imgPath = imgPath;
    this.originalAmountInDeck = originalAmountInDeck;
    this.isPutBack = isPutBack ?? false;
    this.effectName = effectName;
    this.effectInfo = effectInfo;
  }

  applyEffect(
    gameId: string,
    cardDrawer: Hero,
  ): { success: boolean; error?: string } {
    console.log("effectName", this.effectName);
    if (this.effectName === "Deal damage and end turn") {
      dealDamage(gameId, cardDrawer, this.effectInfo?.amountOfDamage ?? 0);
      return { success: true };
    }
    if (this.effectName === "Spawns a monster that attacks") {
      // TODO : implement this effect
      return { success: true };
    }
    if (this.effectName === "Gain gold") {
      cardDrawer.equipment.gold += this.effectInfo?.amountOfGold ?? 0;
      return { success: true };
    }
    if (this.effectName === "Gain potion") {
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

  toJson(): CardAsJson {
    return {
      id: this.id,
      name: this.name,
      imgPath: this.imgPath,
      backImgPath: this.backImgPath,
    };
  }
}

export { TreasureCard };
