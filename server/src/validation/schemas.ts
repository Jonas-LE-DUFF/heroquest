import { z } from "zod";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { Direction } from "../POO/enums/Direction";

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

// --- Lobby Events ---

export const joinGameSchema = z.object({
    gameName: z.string().min(1, "Le nom de la partie est requis"),
    playerName: z.string().min(1, "Le nom du joueur est requis"),
    role: z.enum(PlayerRole),
});


export const chooseCharacterSchema = z.object({
    hero: z.any(), // Hero est un objet complexe, on valide juste sa présence
});

export const unselectCharacterSchema = z.object({
    heroId: z.string().min(1, "L'ID du héros est requis"),
});

// --- Game Actions Events ---

export const castSpellSchema = z.object({
    spellId: z.string().min(1, "L'ID du sort est requis"),
    position: positionSchema,
});

export const attackSchema = z.object({
    attackerId: z.string().min(1, "L'ID de l'attaquant est requis"),
    targetId: z.string().min(1, "L'ID de la cible est requis"),
    wishedNumberOfDices: z.number().int().min(1),
});

// --- Dice Events ---

export const authorizeSpecialThrowSchema = z.object({
    numberOfDices: z.number().int().min(1, "Le nombre de dés doit être au moins 1"),
    typeOfDices: z.enum(["fight", "red"]),
    playerClass: z.enum(HeroCategory),
});

export const rollRedDiceSchema = z.object({
    numberOfDice: z.number().int().min(1, "Le nombre de dés doit être au moins 1"),
});

export const rollDiceSchema = z.object({
    numberOfDice: z.number().int().min(1, "Le nombre de dés doit être au moins 1"),
});

// --- Master Events ---

export const placeElementSchema = z.object({
    position: positionSchema,
    selectedType: z.any(), // TileType | Direction | MonsterCategory - complexe à valider
});

export const updateStatsUnitSchema = z.object({
    newStats: z.any(), // Unit<MonsterCategory | HeroCategory> - objet complexe
    position: positionSchema,
});

// --- Movement Events ---

export const moveUnitOneStepSchema = z.object({
    unitId: z.string().min(1, "L'ID de l'unité est requis"),
    direction: z.enum(Direction),
});

// --- Types inférés ---

export type JoinGameData = z.infer<typeof joinGameSchema>;
export type ChooseCharacterData = z.infer<typeof chooseCharacterSchema>;
export type UnselectCharacterData = z.infer<typeof unselectCharacterSchema>;
export type CastSpellData = z.infer<typeof castSpellSchema>;
export type AttackData = z.infer<typeof attackSchema>;
export type AuthorizeSpecialThrowData = z.infer<typeof authorizeSpecialThrowSchema>;
export type RollRedDiceData = z.infer<typeof rollRedDiceSchema>;
export type RollDiceData = z.infer<typeof rollDiceSchema>;
export type PlaceElementData = z.infer<typeof placeElementSchema>;
export type UpdateStatsUnitData = z.infer<typeof updateStatsUnitSchema>;
export type MoveUnitOneStepData = z.infer<typeof moveUnitOneStepSchema>;
export type PositionData = z.infer<typeof positionSchema>;
