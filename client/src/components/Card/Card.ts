enum CardType {
  Item = "item",
  Spell = "spell",
  Back = "back", // for spell element choice and others
}

interface Card {
  id: string;
  name: string;
  type: CardType;
  image_path: string;
  back_image_path: string;
}

export type { Card };
export { CardType };
