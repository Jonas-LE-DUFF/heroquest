import treasure from "../../../shared/game_cards/treasure.json";
import { Hero } from "../Units/Hero";
import { logger } from "../../../utils/logger";
import { TreasureCard, TreasureCardEffectName } from "./TreasureCard";

class TreasureCardDeck {
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
            card.image_path,
            card.copies,
            card.is_put_back,
            card.effect.name as TreasureCardEffectName | undefined,
            cardEffect,
          ),
        );
      }
    });
    this.cards = shuffle(this.cards);
  }

  pickCard(cardPicker: Hero): TreasureCard {
    const card = this.cards.pop() as TreasureCard;
    const result = card.applyEffect(this.gameId, cardPicker);
    if (!result.success) {
      logger.error(`Failed to apply card effect: ${result.error}`);
      throw new Error(`${result.error}`);
    }
    if (card.isPutBack) {
      this.cards.unshift(card);
      this.cards = shuffle(this.cards);
    }
    return card;
  }
}

function shuffle<T>(array: T[]): T[] {
  const shuffledArray = [...array];

  shuffledArray.sort(() => Math.random() - 0.5);

  return shuffledArray;
}

// only one deck per game -> singleton group pattern
class TreasureCardDeckHandler {
  private static decks: Map<string, TreasureCardDeck> = new Map();

  static getDeck(gameId: string): TreasureCardDeck {
    if (!this.decks.has(gameId)) {
      this.decks.set(gameId, new TreasureCardDeck(gameId));
    }
    return this.decks.get(gameId) as TreasureCardDeck;
  }

  static removeDeck(gameId: string): void {
    this.decks.delete(gameId);
  }
}

export { TreasureCardDeckHandler };
