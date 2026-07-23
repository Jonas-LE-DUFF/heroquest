import { z } from "zod";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { Direction } from "../POO/enums/Direction";
import { SpellElement } from "../POO/enums/SpellElement";
import type { SelectType } from "../POO/types/selectType";

// ============================================
// Schémas de validation pour les événements Socket.IO
// ============================================

// --- Common ---
// Note: Position est validée comme {x, y} mais doit être reconstruite
// en tant que classe Position dans les handlers
export const positionSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
});

export const gameIdSchema = z.object({
  gameId: z.string().min(1, "L'ID de la partie est requis"),
  playerId: z.string().min(1, "L'ID du joueur est requis"),
});

export const heroActionSchema = z.object({
  gameId: z.string().min(1, "L'ID de la partie est requis"),
  playerId: z.string().min(1, "L'ID du joueur est requis"),
  heroId: z.string().min(1, "L'ID du héros est requis"),
});

export const StatSchema = z.object({
  health: z.number().int().min(0),
  maxHealth: z.number().int().min(0),
  attack: z.number().int().min(0),
  defense: z.number().int().min(0),
  movements: z.number().int().min(0),
  spirit: z.number().int().min(0),
  effects: z.array(z.string()),
});

// --- Lobby Events ---

export const joinGameSchema = z.object({
  gameName: z.string().min(1, "Le nom de la partie est requis"),
  playerName: z.string().min(1, "Le nom du joueur est requis"),
  role: z.enum(PlayerRole),
});

export const chooseCharacterSchema = z.object({
  playerId: z.string().min(1, "L'ID du joueur est requis"),
  gameId: z.string().min(1, "L'ID de la partie est requis"),
  heroCreationWish: z.object({
    name: z.string().min(1, "Le nom du héros est requis"),
    heroCategory: z.enum(HeroCategory),
    gold: z.number().int().min(0, "L'or ne peut pas être négatif"),
    spellElements: z.array(z.enum(SpellElement)),
    equipments: z.array(z.string()),
    modifiedHeroId: z.string().optional(),
  }),
});

export const unselectCharacterSchema = z.object({
  gameId: z.string().min(1, "L'ID de la partie est requis"),
  playerId: z.string().min(1, "L'ID du joueur est requis"),
  heroId: z.string().min(1, "L'ID du héros est requis"),
});

// --- Game Actions Events ---

export const castSpellSchema = z.object({
  gameId: z.string().min(1, "L'ID de la partie est requis"),
  playerId: z.string().min(1, "L'ID du joueur est requis"),
  spellId: z.string().min(1, "L'ID du sort est requis"),
  position: positionSchema,
});

export const attackSchema = z.object({
  gameId: z.string().min(1, "L'ID de la partie est requis"),
  playerId: z.string().min(1, "L'ID du joueur est requis"),
  attackerId: z.string().min(1, "L'ID de l'attaquant est requis"),
  targetId: z.string().min(1, "L'ID de la cible est requis"),
  wishedNumberOfDices: z.number().int().min(1),
});

export const drinkPotionSchema = z.object({
  gameId: z.string().min(1, "L'ID de la partie est requis"),
  playerId: z.string().min(1, "L'ID du joueur est requis"),
  heroId: z.string().min(1, "L'ID du héros est requis"),
  potionId: z.string().min(1, "L'ID de la potion est requis"),
});

// --- Trap Events ---

export const disarmTrapSchema = z.object({
  gameId: z.string().min(1, "L'ID de la partie est requis"),
  playerId: z.string().min(1, "L'ID du joueur est requis"),
  heroId: z.string().min(1, "L'ID du héros est requis"),
  position: positionSchema,
});

export const revealTrapSchema = z.object({
  gameId: z.string().min(1, "L'ID de la partie est requis"),
  playerId: z.string().min(1, "L'ID du joueur est requis"),
  position: positionSchema,
});

// --- Dice Events ---

export const authorizeSpecialThrowSchema = z.object({
  gameId: z.string().min(1, "L'ID de la partie est requis"),
  playerId: z.string().min(1, "L'ID du joueur est requis"),
  numberOfDices: z
    .number()
    .int()
    .min(1, "Le nombre de dés doit être au moins 1"),
  typeOfDices: z.enum(["fight", "red"]),
  playerClass: z.enum(HeroCategory),
});
export const rollDiceSchema = z.object({
  gameId: z.string().min(1, "L'ID de la partie est requis"),
  playerId: z.string().min(1, "L'ID du joueur est requis"),
  numberOfDice: z
    .number()
    .int()
    .min(1, "Le nombre de dés doit être au moins 1"),
  kind: z.enum(["fight", "red"]),
});

export const provideRollVectorSchema = z.object({
  gameId: z.string().min(1, "L'ID de la partie est requis"),
  vector: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  boost: z.number().min(0, "Le boost ne peut pas être négatif"),
});

// --- Master Events ---

export const placeElementSchema = z.object({
  gameId: z.string().min(1, "L'ID de la partie est requis"),
  playerId: z.string().min(1, "L'ID du joueur est requis"),
  position: positionSchema,
  selectedType: z.custom<SelectType>(), // SelectType - complexe à valider
});

export const updateStatsUnitSchema = z.object({
  gameId: z.string().min(1, "L'ID de la partie est requis"),
  playerId: z.string().min(1, "L'ID du joueur est requis"),
  newStats: StatSchema, // StatsAsJson - objet complexe
  unitId: z.string().min(1, "L'ID de l'unité est requis"),
});

export const updateEquipmentSchema = z.object({
  gameId: z.string().min(1, "L'ID de la partie est requis"),
  playerId: z.string().min(1, "L'ID du joueur est requis"),
  heroId: z.string().min(1, "L'ID du héros est requis"),
  equipment: z.array(z.string()), // Liste d'IDs d'équipements
  gold: z.number().int().min(0, "L'or ne peut pas être négatif"),
});

// --- Movement Events ---

export const moveUnitOneStepSchema = z.object({
  gameId: z.string().min(1, "L'ID de la partie est requis"),
  playerId: z.string().min(1, "L'ID du joueur est requis"),
  unitId: z.string().min(1, "L'ID de l'unité est requis"),
  direction: z.enum(Direction),
});

// --- Types inférés ---

export type JoinGameData = z.infer<typeof joinGameSchema>;
export type ChooseCharacterData = z.infer<typeof chooseCharacterSchema>;
export type UnselectCharacterData = z.infer<typeof unselectCharacterSchema>;
export type CastSpellData = z.infer<typeof castSpellSchema>;
export type AttackData = z.infer<typeof attackSchema>;
export type AuthorizeSpecialThrowData = z.infer<
  typeof authorizeSpecialThrowSchema
>;
export type RollDiceData = z.infer<typeof rollDiceSchema>;
export type PlaceElementData = z.infer<typeof placeElementSchema>;
export type UpdateStatsUnitData = z.infer<typeof updateStatsUnitSchema>;
export type MoveUnitOneStepData = z.infer<typeof moveUnitOneStepSchema>;
export type PositionData = z.infer<typeof positionSchema>;
