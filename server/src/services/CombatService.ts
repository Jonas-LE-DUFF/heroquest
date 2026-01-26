import { Server, Socket } from "socket.io";
import { rollFightDice } from "./DiceService";
import { Unit } from "../POO/classes/Units/Unit";
import { MonsterCategory } from "../POO/enums/Categories/MonsterCategory";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { Game } from "../POO/classes/Server/Game";
import { FightDiceFaces } from "../POO/enums/Dices/FightDiceFaces";
import { checkUnitDefeat } from "../shared/death/death";
import { ServerToClientEvents } from "../POO/interfaces/Events/ServerToClientEvents";
import { ClientToServerEvents } from "../POO/interfaces/Events/ClientToServerEvents";

async function fight(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    game: Game,
    attacker: Unit<MonsterCategory | HeroCategory>,
    defender: Unit<MonsterCategory | HeroCategory>,
    wishedNumberOfDices: number,
) {
    const isGameMaster = socket.id === game.getGameMaster()?.id;

    const attackDice = isGameMaster ? wishedNumberOfDices : attacker.getAttackDiceCount();
    const roll = await rollFightDice(io, socket, game, attackDice);
    if (!roll.success || !roll.results) {
        throw new Error("Failed to roll fight dice for Djinn DIE spell.");
    }
    const playerThrow = roll.results || [];
    const monsterRoll = await rollFightDice(
        io,
        socket,
        game,
        defender.getDefenseDiceCount(),
    );
    if (!monsterRoll.success || !monsterRoll.results) {
        throw new Error(
            "Failed to roll fight dice for Djinn DIE spell monster.",
        );
    }
    const monsterThrow = monsterRoll.results || [];
    const damageDealt =
        playerThrow.filter((d) => d == FightDiceFaces.Hit).length -
        monsterThrow.filter((d) => d == FightDiceFaces.BlackShield).length;
    if (damageDealt > 0) {
        defender.stats.health -= damageDealt;
        checkUnitDefeat(game.gameState, defender);
    }
}
export { fight };
