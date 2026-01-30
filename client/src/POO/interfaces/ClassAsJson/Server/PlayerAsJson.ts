interface PlayerAsJson {
    id: string;
    name: string;
    role: "hero" | "game-master";
}

export type { PlayerAsJson };