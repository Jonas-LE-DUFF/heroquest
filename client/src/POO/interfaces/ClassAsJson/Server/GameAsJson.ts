import { HeroCategory } from "../../../enums/Categories/HeroCategory";
import { GameStateAsJson } from "./GameStateAsJson";
import { PlayerAsJson } from "./PlayerAsJson";

interface GameAsJson {
    id: string;
    name: string;
    players: PlayerAsJson[];
    playOrder: HeroCategory[];
    isMonsterTurn: boolean;
    currentTurnIndex: number;
    gameState: GameStateAsJson;
}

export type { GameAsJson };