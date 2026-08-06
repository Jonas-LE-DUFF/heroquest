import { PlayerRole } from "../../../enums/PlayerRole";
import { PositionAsJson } from "../PositionAsJson";

interface PlayerAsJson {
  id: string;
  name: string;
  role: PlayerRole;
  isReady: boolean;
  socketId: string | null;
  markedPosition?: PositionAsJson | undefined;
}

export type { PlayerAsJson };
