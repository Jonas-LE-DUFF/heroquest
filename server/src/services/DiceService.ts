import { Server, Socket } from "socket.io";
import { ClientToServerEvents } from "../POO/interfaces/Events/ClientToServerEvents";
import { ServerToClientEvents } from "../POO/interfaces/Events/ServerToClientEvents";
import { Game } from "../POO/classes/Server/Game";
import { FightDiceFaces } from "../POO/enums/Dices/FightDiceFaces";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { requirePlayerTurn } from "../guards/requirePlayerTurn";
import { SpecialAuthorizedHero } from "../POO/interfaces/SpecialAuthorizedHero";

const sleep = (ms: number) => {
    return new Promise((r) => setTimeout(r, ms));
};

export async function rollFightDice(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    game: Game,
    wishedNumberOfDices: number,
) {
    if (!requirePlayerTurn(socket, game)) {
        return {
            success: false,
            error: "Ce n'est pas votre tour",
        };
    }

    const playerId = game.getCurrentPlayerTurnId();
    const isGameMaster = socket.id === game.getGameMaster()?.id;

    const specialAuthorizedHero = game.gameState.getSpecialAuthorizedHero();

    let numberOfDices: number | undefined;

    const playerRole = game.getPlayer(socket.id)?.role;
    if (!playerRole) {
        console.error("player role couldn't be found");
        return {
            success: false,
            error: "aucun rôle trouvé pour le joueur lançant les dés de combat",
        };
    }

    if (
        wishedNumberOfDices !== undefined &&
        wishedNumberOfDices > 0 &&
        isGameMaster
    ) {
        // if player is game-master he can choose the amount of dices
        numberOfDices = wishedNumberOfDices;
    } else if (
        specialAuthorizedHero &&
        specialAuthorizedHero.heroId === socket.id &&
        specialAuthorizedHero.diceType === "fight"
    ) {
        // if player is specialy authorized to roll fight dices
        console.log("using special authorized dices");
        numberOfDices = specialAuthorizedHero.numberOfDices;
        game.gameState.setSpecialAuthorizedHero(undefined);
    } else {
        numberOfDices = game.getCurrentHeroTurn().getAttackDiceCount();
    }

    if (numberOfDices === undefined) {
        console.log("no amount of dice to throw defined");
        return {
            success: false,
            error: "pas de nombre de dés à lancer défini",
        };
    }

    let results: FightDiceFaces[] = [];
    for (let j = 0; j < 15; j++) {
        results = [];
        for (let i = 0; i < numberOfDices; i++) {
            const randomNumber = Math.floor(Math.random() * 6 + 1);
            let face: FightDiceFaces = FightDiceFaces.Hit;
            if (randomNumber === 1) {
                face = FightDiceFaces.BlackShield;
            } else if (randomNumber < 3) {
                face = FightDiceFaces.WhiteShield;
            } else {
                face = FightDiceFaces.Hit;
            }
            results.push(face);
        }
        io.to(game.id).emit("dice-update", {
            listResults: results,
            role: playerRole,
        });

        await sleep(75);
    }
    return { success: true, results: results };
}

export async function rollRedDice(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    game: Game,
    wishedNumberOfDices: number,
) {
    console.log("roll-red-dice");
    let numberOfDices; // default number of dices

    const specialAuthorizedHero = game.gameState.getSpecialAuthorizedHero();
    const isGameMaster = socket.id === game.getGameMaster()?.id;

    const player = game.getPlayer(socket.id);
    if (!player) {
        console.error("no player found for rolling red dices");
        return {
            success: false,
            error: "le joueur lançant les dés rouges n'a pas pu être trouvé",
        };
    }
    const playerRole = player.role;
    if (!playerRole) {
        console.error("no role found for player rolling red dices");
        return {
            success: false,
            error: "aucun rôle trouvé pour le joueur lançant les dés rouges",
        };
    }

    if (
        wishedNumberOfDices !== undefined &&
        wishedNumberOfDices > 0 &&
        isGameMaster // if player is game-master he can choose the amount of dices
    ) {
        numberOfDices = wishedNumberOfDices;
    } else if (
        specialAuthorizedHero &&
        specialAuthorizedHero.heroId === socket.id &&
        specialAuthorizedHero.diceType === "red"
        // if player is specialy authorized to roll red dices
    ) {
        numberOfDices = specialAuthorizedHero.numberOfDices;
        game.gameState.setSpecialAuthorizedHero(undefined);
    } else {
        const hero = game.gameState.getHeroById(socket.id);
        if (!hero) {
            console.error("hero couldn't be found for red dice roll");
            return {
                success: false,
                error: "le héros du joueur lançant les dés rouges n'a pas pu être trouvé",
            };
        }
        numberOfDices = hero.stats.movements;
    }

    let results: number[] = [];
    for (let j = 0; j < 15; j++) {
        results = [];
        for (let i = 0; i < numberOfDices; i++) {
            const randomNumber = Math.floor(Math.random() * 6 + 1);
            results.push(randomNumber);
        }
        io.to(game.id).emit("red-dice-update", {
            listResults: results,
            role: playerRole,
        });
        await sleep(75);
    }
    return { success: true, results: results };
}

export async function grantSpecialRollAuthorization(
    game: Game,
    io: Server<ServerToClientEvents>,
    numberOfDices: number,
    typeOfDices: "fight" | "red",
    playerId: HeroCategory | string, // can be playerId or heroClass
) {
    let hero;
    if (typeof playerId !== "string") {
        hero = game.gameState.getHeroByCategory(playerId);
    }else{
        hero = game.gameState.getHeroById(playerId);
    }

    if (!hero) {
        console.error("hero couldn't be found for special dice authorization");
        return {
            success: false,
            error: "le héros n'a pas pu être trouvé pour l'autorisation spéciale de lancer des dés",
        };
    }

    const specialAuthorizedHero : SpecialAuthorizedHero = {
        heroId: hero.id,
        numberOfDices,
        diceType: typeOfDices,
    };
    game.gameState.setSpecialAuthorizedHero(specialAuthorizedHero);

    io.to(game.id).emit("special-authorization", {
        playerId: hero.controlledByPlayerId,
        amountOfDices: numberOfDices,
        typeOfDices: typeOfDices,
    });

    return { success: true };
}
