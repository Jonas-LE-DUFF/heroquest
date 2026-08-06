import { Unit } from "../POO/classes/Units/Unit";
import { MonsterCategory } from "../POO/enums/Categories/MonsterCategory";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { Game } from "../POO/classes/Server/Game";
import { FightDiceFaces } from "../POO/enums/Dices/FightDiceFaces";
import { checkUnitDefeat } from "../shared/death/death";
import { DiceServiceRegistry } from "./DiceServiceRegistry";

function fight(
  game: Game,
  attacker: Unit<MonsterCategory | HeroCategory>,
  defender: Unit<MonsterCategory | HeroCategory>,
) {
  const attackDiceAmount = attacker.getAttackDiceCount();

  const dice = DiceServiceRegistry.get();
  dice.rollDice({
    gameId: game.id,
    wishedNumberOfDices: attackDiceAmount,
    playerId: attacker.controlledByPlayerId,
    kind: "fight",
    callback: (result) => defend(game, defender, result),
  });

  // wait for attacker to roll dice
}

function defend(
  game: Game,
  defender: Unit<MonsterCategory | HeroCategory>,
  attackResults: FightDiceFaces[] | number[],
): void {
  const dice = DiceServiceRegistry.get();
  const defenderDiceAmount = defender.getDefenseDiceCount();
  dice.rollDice({
    gameId: game.id,
    wishedNumberOfDices: defenderDiceAmount,
    playerId: defender.controlledByPlayerId,
    kind: "fight",
    callback: (defenderResults) => {
      const defenderThrow = defenderResults as FightDiceFaces[];
      const attackerThrow = attackResults as FightDiceFaces[];
      const damageDealt =
        attackerThrow.filter((d) => d == FightDiceFaces.Hit).length -
        defenderThrow.filter((d) => d == FightDiceFaces.BlackShield).length;

      dealDamage(game.id, defender, damageDealt);
    },
  });
}

function dealDamage(
  gameId: string,
  target: Unit<HeroCategory | MonsterCategory>,
  damage: number,
) {
  if (target.stats.health !== undefined && damage > 0) {
    target.stats.health = Math.max(target.stats.health - damage, 0);
  }
  checkUnitDefeat(gameId, target);
}

export { fight, dealDamage };
