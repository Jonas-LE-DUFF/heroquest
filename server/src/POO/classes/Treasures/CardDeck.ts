import treasure from "../../../shared/game_cards/treasure.json";

import { TreasureCard } from "./TreasureCard";

class CardDeck {
  gameId: string;
  cards: TreasureCard[] = [];
  constructor(gameId: string) {
    this.gameId = gameId;

    treasure.deck.forEach((card) => {
      const cardEffect = {
        amountOfDamage: card.effect.amount_of_damage ?? 0,
        amountOfGold: card.effect.amount_of_gold ?? 0,
        potionReference: card.effect.potion_gained ?? "",
      };
      for (let i = 0; i < card.copies; i++) {
        this.cards.push(
          new TreasureCard(
            card.id,
            card.name,
            card.img_path,
            card.copies,
            card.effect.name,
            cardEffect,
          ),
        );
      }
    });
  }
}
