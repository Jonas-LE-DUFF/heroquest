import { randomUUID } from "crypto";
import { PlayerRole } from "../../enums/PlayerRole";

class Player {
    id: string;
    name: string;
    role: PlayerRole;

    constructor(name: string, role: PlayerRole) {
        this.id = randomUUID();
        this.name = name;
        this.role = role;
    }
}

export { Player };