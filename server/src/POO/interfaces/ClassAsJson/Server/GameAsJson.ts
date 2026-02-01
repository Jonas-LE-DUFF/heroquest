import { HeroCategory } from "../../../enums/Categories/HeroCategory";
import { GameStateAsJson } from "./GameStateAsJson";
import { PlayerAsJson } from "./PlayerAsJson";

interface GameAsJson {
    id: string;
    name: string;
    players: PlayerAsJson[];
    gameState: GameStateAsJson;
    playOrder: HeroCategory[];
    isMonsterTurn: boolean;
    currentTurnIndex: number;
}

export type { GameAsJson };