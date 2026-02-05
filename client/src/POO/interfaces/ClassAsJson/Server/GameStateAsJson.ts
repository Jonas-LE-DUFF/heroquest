import { BoardAsJson } from "../Board/BoardAsJson";
import { HeroAsJson } from "../Unit/HeroAsJson";
import { MonsterAsJson } from "../Unit/MonsterAsJson";

interface GameStateAsJson {
    Units: (HeroAsJson | MonsterAsJson)[];
    board: BoardAsJson;
    status: "lobby" | "playing" | "finished";
}

export type { GameStateAsJson };