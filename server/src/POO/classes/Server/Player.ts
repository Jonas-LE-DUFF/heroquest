import { randomUUID } from "crypto";
import { PlayerRole } from "../../enums/PlayerRole";

class Player {
    id: string;
    name: string;
    role: PlayerRole;
    isReady: boolean = false;

    constructor(name: string, role: PlayerRole) {
        this.id = randomUUID();
        this.name = name;
        this.role = role;
        this.isReady = false;
    }
}

export { Player };