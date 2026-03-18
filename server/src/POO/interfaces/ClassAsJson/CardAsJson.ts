interface CardAsJson {
  id: string;
  name: string;
  imgPath: string;
  backImgPath: string;
  type?: CardType;
}

enum CardType {
  Back = "Back",
  Spell = "Spell",
  Item = "Item",
}

export type { CardAsJson };
export { CardType };
