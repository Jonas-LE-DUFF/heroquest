import { IDiceService } from "../POO/interfaces/IClass/IDiceService";
import { DiceService } from "./DiceService";

let instance: IDiceService = new DiceService(); // défaut en prod

export const DiceServiceRegistry = {
  get(): IDiceService {
    return instance;
  },
  override(mock: IDiceService): void {
    instance = mock;
  },
  reset(): void {
    instance = new DiceService();
  },
};
