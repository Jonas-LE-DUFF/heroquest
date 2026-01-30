import { StatsAsJson } from "./StatsAsJson";

interface MonsterAsJson {
    id: string;
    name: string;
    category: string;
    stats: StatsAsJson;
}

export type { MonsterAsJson };