import { MonsterCategory } from "../../../enums/Categories/MonsterCategory";
import { StatsAsJson } from "./StatsAsJson";

interface MonsterAsJson {
    id: string;
    name: string;
    category: MonsterCategory;
    stats: StatsAsJson;
}

export type { MonsterAsJson };