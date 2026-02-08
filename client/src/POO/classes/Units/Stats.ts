interface Stats {
  movements: number;
  health: number;
  maxHealth: number;
  nbDefenseDice: number;
  spirit: number;
  effects: string[]; // List of status effect names
}

export type { Stats };
