interface WeaponAsJson {
    id: string;
    name: string;
    damage: number;
    range: "ranged" | "melee" | "long-melee";
    cost: number;
}

export type { WeaponAsJson };