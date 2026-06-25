import { randomUUID } from "crypto";
import { PlayerRole } from "../../enums/PlayerRole";
import { PlayerAsJson } from "../../interfaces/ClassAsJson/Server/PlayerAsJson";

class Player {
    
    public readonly id: string;
    public socketId: string | null = null;
    name: string;
    role: PlayerRole;
    isReady: boolean = false;

    constructor(name: string, role: PlayerRole, socketId: string | null = null) {
        this.id = randomUUID();
        this.socketId = socketId;
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
            socketId: this.socketId
        };
    }
}

export { Player };