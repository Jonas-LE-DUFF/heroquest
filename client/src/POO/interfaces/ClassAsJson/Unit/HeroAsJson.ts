import { EquipmentAsJson } from "../Equipment/EquipmentAsJson";
import { SpellAsJson } from "../SpellAsJson";
import { StatsAsJson } from "./StatsAsJson";

interface HeroAsJson {
    id: string;
    controlledByPlayerId: string;
    name: string;
    category: string;
    stats: StatsAsJson;
    equipment: EquipmentAsJson;
    spells: SpellAsJson[];
}

export type { HeroAsJson };