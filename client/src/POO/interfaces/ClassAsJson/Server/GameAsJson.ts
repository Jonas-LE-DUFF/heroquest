import { PlayerAsJson } from "./PlayerAsJson";

interface GameAsJson {
    id: string;
    name: string;
    players: PlayerAsJson[];
    gameState: any;

}

export type { GameAsJson };