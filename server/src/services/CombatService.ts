import { Unit } from "../POO/classes/Units/Unit";
import { MonsterCategory } from "../POO/enums/Categories/MonsterCategory";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { Game } from "../POO/classes/Server/Game";
import { FightDiceFaces } from "../POO/enums/Dices/FightDiceFaces";
import { checkUnitDefeat } from "../shared/death/death";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { GameService } from "./GameService";
import { emitGameStateUpdate } from "../utils/gameStateEmitter";
import { DiceServiceRegistry } from "./DiceServiceRegistry";

function fight(
  playerId: string,
  game: Game,
  attacker: Unit<MonsterCategory | HeroCategory>,
  defender: Unit<MonsterCategory | HeroCategory>,
  wishedNumberOfDices: number,
) {
  const isGameMaster = playerId === game.getGameMaster()?.id;

  const defenderRole: PlayerRole = defender.getRole();
  const attackerRole: PlayerRole = attacker.getRole();
  const defenderDiceAmount = defender.getDefenseDiceCount();
  const attackDiceAmount = isGameMaster
    ? wishedNumberOfDices
    : attacker.getAttackDiceCount();

  const dice = DiceServiceRegistry.get();
  const attackerRoll = dice.rollFightDice(
    game.id,
    attackDiceAmount,
    attackerRole,
  );
  if (!attackerRoll.success || !attackerRoll.results) {
    throw new Error("Failed to roll fight dice for Djinn DIE spell.");
  }

  const defenderRoll = dice.rollFightDice(
    game.id,
    defenderDiceAmount,
    defenderRole,
  );
  if (!defenderRoll.success || !defenderRoll.results) {
    throw new Error("Failed to roll fight dice for Djinn DIE spell monster.");
  }
  const defenderThrow = defenderRoll.results;
  const attackerThrow = attackerRoll.results;
  const damageDealt =
    attackerThrow.filter((d) => d == FightDiceFaces.Hit).length -
    defenderThrow.filter((d) => d == FightDiceFaces.BlackShield).length;

  dealDamage(game.id, defender, damageDealt);
}

function dealDamage(
  gameId: string,
  target: Unit<HeroCategory | MonsterCategory>,
  damage: number,
) {
  if (target.stats.health !== undefined && damage > 0) {
    target.stats.health = Math.max(target.stats.health - damage, 0);
  }
  const defeated = checkUnitDefeat(gameId, target);
  if (defeated) {
    console.log(
      `Unit ${target.id} has been defeated and removed from the game.`,
    );
    const io = ServerHeroQuest.getServerInstance().getIo();
    const game = GameService.getGame(gameId);
    if (game) {
      emitGameStateUpdate(io, gameId, game);
    } else {
      console.error("Game not found for gameId:", gameId);
    }
  }
}

export { fight, dealDamage };
