import { PlayerRole } from "../../../enums/PlayerRole";

interface PlayerAsJson {
    id: string;
    name: string;
    role: PlayerRole;
    isReady: boolean;
}

export type { PlayerAsJson };