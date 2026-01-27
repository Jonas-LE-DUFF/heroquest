import { Socket } from "socket.io";
import { rollFightDice } from "./DiceService";
import { Unit } from "../POO/classes/Units/Unit";
import { MonsterCategory } from "../POO/enums/Categories/MonsterCategory";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { Game } from "../POO/classes/Server/Game";
import { FightDiceFaces } from "../POO/enums/Dices/FightDiceFaces";
import { checkUnitDefeat } from "../shared/death/death";
import { ServerToClientEvents } from "../POO/interfaces/Events/ServerToClientEvents";
import { ClientToServerEvents } from "../POO/interfaces/Events/ClientToServerEvents";
import { PlayerRole } from "../POO/enums/PlayerRole";

async function fight(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    game: Game,
    attacker: Unit<MonsterCategory | HeroCategory>,
    defender: Unit<MonsterCategory | HeroCategory>,
    wishedNumberOfDices: number,
) {
    const isGameMaster = socket.data.playerId === game.getGameMaster()?.id;

    const defenderRole: PlayerRole = defender.getRole();
    const attackerRole: PlayerRole = attacker.getRole();
    const defenderDiceAmount = defender.getDefenseDiceCount();
    const attackDiceAmount = isGameMaster
        ? wishedNumberOfDices
        : attacker.getAttackDiceCount();

    const attackerRoll = await rollFightDice(
        game.id,
        attackDiceAmount,
        attackerRole,
    );
    if (!attackerRoll.success || !attackerRoll.results) {
        throw new Error("Failed to roll fight dice for Djinn DIE spell.");
    }
    const defenderRoll = await rollFightDice(
        game.id,
        defenderDiceAmount,
        defenderRole,
    );
    if (!defenderRoll.success || !defenderRoll.results) {
        throw new Error(
            "Failed to roll fight dice for Djinn DIE spell monster.",
        );
    }
    const defenderThrow = defenderRoll.results;
    const attackerThrow = attackerRoll.results;
    const damageDealt =
        attackerThrow.filter((d) => d == FightDiceFaces.Hit).length -
        defenderThrow.filter((d) => d == FightDiceFaces.BlackShield).length;

    dealDamage(game.id, defender, damageDealt);
}

function dealDamage(gameId: string, target: Unit<HeroCategory | MonsterCategory>, damage: number) {
    if (target.stats.health !== undefined && damage > 0) {
        target.stats.health = Math.max(target.stats.health - damage, 0);
    }
    checkUnitDefeat(gameId, target);
}

export { fight, dealDamage };
