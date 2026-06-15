import { GameAsJson } from "../interfaces/ClassAsJson/Server/GameAsJson";

interface LocationState {
    game: GameAsJson;
    playerId: string;
}

export type { LocationState };