export function requireGameExists(
    gameId: string,
    games: Map<string, any>
): boolean {
    return games.has(gameId);
}