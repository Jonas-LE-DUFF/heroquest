import { ServerHeroQuest } from "../server/ServerHeroQuest";

export function requireGameExists(
    gameId: string,
): boolean {
    const serverHeroQuest = ServerHeroQuest.getServerInstance();
    if (serverHeroQuest.getGame(gameId) === undefined){
        console.error("Game not found with id:", gameId);
        return false;
    }
    return true;
}
