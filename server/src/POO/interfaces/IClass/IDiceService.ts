import { FightDiceFaces } from "../../enums/Dices/FightDiceFaces";

export type RollProps = {
  gameId: string;
  wishedNumberOfDices: number;
  playerId: string;
};

export interface IDiceService {
  rollRedDice(rollProps: RollProps): {
    success: boolean;
    results?: number[];
    error?: string;
  };
  rollFightDice(rollProps: RollProps): {
    success: boolean;
    results?: FightDiceFaces[];
    error?: string;
  };
  resolveWithVector(
    gameId: string,
    vector: { x: number; y: number; z: number; boost: number },
  ): {
    success: boolean;
    error?: string;
  };
}
