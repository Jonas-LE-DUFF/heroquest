import { FightDiceFaces } from "../../enums/Dices/FightDiceFaces";
import { PlayerRole } from "../../enums/PlayerRole";

export interface IDiceService {
  rollRedDice(
    gameId: string,
    numberOfDices: number,
    playerRole: PlayerRole,
  ): Promise<{ success: boolean; results?: number[]; error?: string}>;
  rollFightDice(
    gameId: string,
    numberOfDices: number,
    playerRole: PlayerRole,
  ): Promise<{ success: boolean; results?: FightDiceFaces[]; error?: string}>;
}
