import spells from "../game_cards/spells.json";
import { isPositionVisible } from "./range";
import {
  grantSpecialRollAuthorization,
  rollFightDice,
  rollRedDice,
} from "../../services/DiceService";
import { checkUnitDefeat } from "../death/death";
import { Server, Socket } from "socket.io";
import { Spell } from "../../POO/classes/Spell/Spell";
import { SpellElement } from "../../POO/enums/SpellElement";
import { Player } from "../../POO/classes/Server/Player";
import { Position } from "../../POO/classes/Position/Position";
import { ClientToServerEvents } from "../../POO/interfaces/Events/ClientToServerEvents";
import { ServerToClientEvents } from "../../POO/interfaces/Events/ServerToClientEvents";
import { Hero } from "../../POO/classes/Units/Hero";
import { Game } from "../../POO/classes/Server/Game";
import { fight } from "../../services/CombatService";
import { Unit } from "../../POO/classes/Units/Unit";
import { HeroCategory } from "../../POO/enums/Categories/HeroCategory";
import { MonsterCategory } from "../../POO/enums/Categories/MonsterCategory";

export function getSpell(spellId: string): Spell | undefined {
  return (spells as unknown as Spell[]).find((s) => s.id === spellId);
}

export async function castSpell(
  game: Game,
  spellId: string,
  targetedPosition: Position,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: Server<ClientToServerEvents, ServerToClientEvents>
) {
  console.log("applying effects of casted spell");

  const heroCasting = game.getCurrentHeroTurn();
  const player = game.getCurrentPlayerTurn();

  const spell = getSpell(spellId);
  if (!spell) {
    throw new Error("Spell not found: " + spellId);
  }

  if (heroCasting.usedSpells.includes(spell)) {
    throw new Error("Player already used this spell.");
  }

  if(heroCasting.spells.find(s => s.id === spellId) === undefined){
    throw new Error("Hero doesn't know this spell.");
  }

  if (spell.id.includes("Djinn")) {
    if (spell.id === "Djinn") return; // this spell allows to choose between sub-spells
    if (spell.id === "Djinn Open door") {
      heroCasting.usedSpells.push(spell);
      throw new Error("Djinn Open door spell effect not implemented yet.");
    }

    if (spell.id === "Djinn DIE") {
      const unitTarget = game.gameState.board.getUnitAt(targetedPosition);
      
      if (!unitTarget) {
        throw new Error("No target found at the specified position.");
      }
      grantSpecialRollAuthorization(game, io, 5, "fight", player.id);
      fight(io, socket, game, heroCasting, unitTarget, 5);
      heroCasting.usedSpells.push(spell);
      return;
    }
    throw new Error("Unknown Djinn sub-spell: " + spell.id);
  }

  const position = game.gameState.board.getPositionOfUnit(heroCasting.id);

  if (!position) {
    throw new Error("Player position not found.");
  }

  if (isPositionVisible(position, targetedPosition) === false) {
    throw new Error("Target position is not visible.");
  }

  const target : Unit<HeroCategory | MonsterCategory> | undefined = game.gameState.board.getUnitAt(targetedPosition);

  if (!target) {
    if(spell.target_type.includes("no target")){
      throw new Error("Target entity not found.");
    }
  }else{
    if (target.id === player.id && !spell.target_type.includes("self")) {
      throw new Error("Spell can't be cast on self.");
    }
    if (target.getCategory() !== "HeroCategory" && !spell.target_type.includes("hero")) {
      throw new Error("Spell can't be cast on heroes.");
    }
    if (target.getCategory() !== "MonsterCategory" && !spell.target_type.includes("monster")) {
      throw new Error("Spell can't be cast on monsters.");
    }
  }

  spell.applyEffect(target ? target : heroCasting);
  switch (spell.effect) {
    case "buff": {
      if (!entity_target || !entity_target.stats){
        throw new Error("No target to buff found.");
      };

      const statToBuff = spell.effect.stat as keyof typeof entity_target.stats;
      const rawValue = spell.effect.value ?? "0";
      const sign = rawValue[0];
      const parsed = parseInt(rawValue.replace(/[-+*]/, ""));
      
      switch (sign) {
        case "+":
          applyBuff(entity_target.stats, statToBuff, parsed, (a, b) => a + b);
          break;
        case "-":
          applyBuff(entity_target.stats, statToBuff, parsed, (a, b) => a - b);
          break;
        case "*":
          applyBuff(entity_target.stats, statToBuff, parsed, (a, b) => a * b);
          break;
        default:
          throw new Error("Unknown buff sign: " + sign);
      }
      break;
    }
    case "damage":
      // Damage effect to be implemented
      if (spell.effect.comment === "monster roll red dices") {
        if (!entity_target) {
          throw new Error("Monster target not found.");
        }
        let damages = parseInt(spell.effect.value?.replace("-", "") || "0");
        console.log("ROLLING DICEEEEEEES");
        const gameMasterId = gameState.turnOrder[4] ?? "";
        const res = await rollRedDice(io, gameMasterId, gameState, damages);
        if (!res.success) {
          console.error("Failed to roll red dice:", res.error);
          return;
        }
        if (!res.results) return;
        for (const diceValue of res.results) {
          if (diceValue >= 5) {
            damages -= 1;
          }
        }
        if (entity_target.stats?.hp === undefined) {
          throw new Error("Monster target has no health stat.");
        }
        console.log("dealing damages:", damages);
        entity_target.stats.hp -= damages;
        checkUnitDefeat(gameState, entity_target);
      }
    case "apply status":
      if (!entity_target?.stats?.statusEffects){
        throw new Error("No target to apply status effect found.");
      }
      const statusEffect = {
        duration: spell.effect.value || "unknown",
        relatedSpell: spell.id,
        effectName: spell.effect.status_type || "unknown",
      };
      entity_target.stats.statusEffects.push(statusEffect);
      break;


    case "special":
      break;
    // Implement other spell effects here
    default:
      throw new Error(
        "Spell effect type not implemented: " + spell.effect.type
      );
  }

  return gameState;
}

function applyBuff(
  stats: Unit,
  statToBuff: string,
  buffValue: number,
  buff: (a: number, b: number) => number
): void {
  const key = statToBuff as unknown as string;
  const current = Number((stats as any)[key] ?? 0);
  (stats as any)[key] = buff(current, buffValue);
}
