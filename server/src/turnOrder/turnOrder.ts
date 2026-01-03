import { GameState } from "../shared/type";

function getNextPlayerTurn(game: GameState): string | null {
    const currentIndex = game.turnOrder.indexOf(game.currentTurn);

    if (currentIndex === -1) {
        return null;
    }
    let nextIndex = (currentIndex + 1) % game.turnOrder.length;
    while (game.turnOrder[nextIndex] === undefined) {
        nextIndex = (nextIndex + 1) % game.turnOrder.length;
        if (nextIndex === currentIndex) {
            return null; // No other players found
        }
    }
    return game.turnOrder[nextIndex] || null;
}

export { getNextPlayerTurn };