import { z } from "zod";
import { Socket } from "socket.io";
import { Position } from "../POO/classes/Position/Position";
import { PositionData } from "./schemas";

// Type générique pour un schéma Zod (remplace ZodSchema déprécié)
type ZodType<T = unknown> = z.ZodType<T>;

// Réponse standardisée pour tous les handlers
export interface SocketResponse<T = unknown> {
  success: boolean;
  data?: T | undefined;
  error?: string;
}

// Type pour un callback Socket.IO optionnel
type SocketCallback<T = unknown> = ((response: SocketResponse<T>) => void) | undefined;

// Type pour un handler validé
type ValidatedHandler<TSchema extends ZodType, TResponse = unknown> = (
  socket: Socket,
  data: z.infer<TSchema>,
  callback: (response: SocketResponse<TResponse>) => void
) => void | Promise<void>;

/**
 * Formate les erreurs Zod en message lisible
 */
function formatZodError(error: z.ZodError): string {
  return error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join(", ");
}

/**
 * Crée un handler Socket.IO avec validation automatique des données
 * 
 * @param socket - Le socket courant (capturé dans la closure)
 * @param schema - Le schéma Zod pour valider les données entrantes
 * @param handler - Le handler qui sera appelé avec les données validées
 * @returns Une fonction qui prend un socket et retourne un handler Socket.IO validé
 * 
 * @example
 * ```typescript
 * socket.on("join-game", withValidation(socket, joinGameSchema, async (socket, data, callback) => {
 *   // data est typé et validé automatiquement
 *   const { gameName, playerName, role } = data;
 *   // ... logique métier
 *   callback({ success: true });
 * }));
 * ```
 */
export function withValidation<TSchema extends ZodType, TResponse = unknown>(
  socket: Socket,
  schema: TSchema,
  handler: ValidatedHandler<TSchema, TResponse>
) {
  return async (rawData: unknown, callback?: SocketCallback<TResponse>) => {
    // Wrapper pour gérer les callbacks optionnels
    const safeCallback = (response: SocketResponse<TResponse>) => {
      if (callback && typeof callback === "function") {
        callback(response);
      } else {
        // Log si pas de callback (pour debugging)
        if (!response.success) {
          console.warn(`[Socket ${socket.id}] Pas de callback fourni. Erreur non envoyée: ${response.error}`);
        }
      }
    };

    try {
      // Validation des données
      const result = schema.safeParse(rawData);

      if (!result.success) {
        const errorMessages = formatZodError(result.error);
        console.warn(`[Socket ${socket.id}] Validation échouée: ${errorMessages}`);
        safeCallback({ success: false, error: `Données invalides: ${errorMessages}` });
        return;
      }

      // Appel du handler avec les données validées
      await handler(socket, result.data, safeCallback);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur interne du serveur";
      console.error(`[Socket ${socket.id}] Erreur dans le handler:`, error);
      safeCallback({ success: false, error: errorMessage });
    }
  };
}

/**
 * Crée un handler Socket.IO sans validation (pour les événements sans données)
 * 
 * @param socket - Le socket courant (capturé dans la closure)
 * @param handler - Le handler qui sera appelé
 * @returns Un handler Socket.IO avec gestion d'erreurs et callback optionnel
 */
export function withErrorHandling<TResponse = unknown>(
  socket: Socket,
  handler: (socket: Socket, callback: (response: SocketResponse<TResponse>) => void) => void | Promise<void>
) {
  return async (callback?: SocketCallback<TResponse>) => {
    const safeCallback = (response: SocketResponse<TResponse>) => {
      if (callback && typeof callback === "function") {
        callback(response);
      }
    };

    try {
      await handler(socket, safeCallback);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur interne du serveur";
      console.error(`[Socket ${socket.id}] Erreur dans le handler:`, error);
      safeCallback({ success: false, error: errorMessage });
    }
  };
}

/**
 * Helper pour créer une réponse de succès
 */
export function successResponse<T>(data?: T): SocketResponse<T> {
  if (data !== undefined) {
    return { success: true, data };
  }
  return { success: true };
}

/**
 * Helper pour créer une réponse d'erreur
 */
export function errorResponse(error: string): SocketResponse {
  return { success: false, error };
}

/**
 * Convertit les données de position validées en instance de classe Position
 */
export function toPosition(pos: PositionData): Position {
  return new Position(pos.x, pos.y);
}
