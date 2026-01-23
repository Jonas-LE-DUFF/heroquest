import { PlayerRole } from "../../enums/PlayerRole";

class Player {
    id: string;
    name: string;
    role: PlayerRole;

    constructor(id: string, name: string, role: PlayerRole) {
        this.id = id;
        this.name = name;
        this.role = role;
    }
}

export { Player };