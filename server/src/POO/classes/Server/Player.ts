import { randomUUID } from "crypto";
import { PlayerRole } from "../../enums/PlayerRole";
import { PlayerAsJson } from "../../interfaces/ClassAsJson/Server/PlayerAsJson";

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

    toJson(): PlayerAsJson {
        return {
            id: this.id,
            name: this.name,
            role: this.role,
            isReady: this.isReady,
        };
    }
}

export { Player };