interface StatsAsJson {
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  movements: number;
  spirit: number;
  effects: string[]; // List of status effect names
}

export type { StatsAsJson };
