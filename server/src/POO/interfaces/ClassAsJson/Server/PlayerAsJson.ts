import { PlayerRole } from "../../../enums/PlayerRole";

interface PlayerAsJson {
  id: string;
  name: string;
  role: PlayerRole;
  isReady: boolean;
  socketId: string | null;
}

export type { PlayerAsJson };
