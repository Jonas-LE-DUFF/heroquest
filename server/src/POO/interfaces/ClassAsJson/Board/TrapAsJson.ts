import { TrapType } from "../../../enums/Board/TrapType";

interface TrapAsJson {
  type: TrapType;
  isRevealed: boolean;
  hasBeenTriggered: boolean;
}

export type { TrapAsJson };