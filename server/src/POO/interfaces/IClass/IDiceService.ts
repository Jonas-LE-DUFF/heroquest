import { FightDiceFaces } from "../../enums/Dices/FightDiceFaces";

export type RollProps = {
  gameId: string;
  wishedNumberOfDices: number;
  playerId: string;
  kind: "fight" | "red";
  callback: (results: FightDiceFaces[] | number[]) => void;
};

export interface IDiceService {
  rollDice(rollProps: RollProps): void;
  resolveWithVector(
    gameId: string,
    playerId: string,
    vector: { x: number; y: number; z: number; boost: number },
  ): {
    success: boolean;
    error?: string;
  };
}
