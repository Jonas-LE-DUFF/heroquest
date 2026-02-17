import { ItemAsJson } from "./ItemAsJson";

interface PotionAsJson extends ItemAsJson {
  effect: string;
}

export type { PotionAsJson };
