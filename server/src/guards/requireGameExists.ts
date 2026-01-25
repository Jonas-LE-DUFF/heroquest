import { GameService } from "../services/GameService";

export function requireGameExists(
    gameId: string,
    games: Map<string, any>,
): boolean {
    if (!games.has(gameId)) {
        console.error("Game not found with id:", gameId);
        return false;
    }
    return true;
}

export function requireGameExistsGameService(
    gameId: string,
    gameService: GameService,
): boolean {
    if (gameService.getGame(gameId) === undefined){
        console.error("Game not found with id:", gameId);
        return false;
    }
    return true;
}
