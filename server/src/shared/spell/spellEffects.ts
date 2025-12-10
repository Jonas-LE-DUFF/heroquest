import {
  GameState,
  Player,
  Position,
  spellElement,
  tileType,
  Unit,
} from "../type";
import spells from "../game_cards/spells.json";
import { isPositionVisible } from "./range";
import { handleRollRedDice, rollRedDice } from "../dicesControllers";
import { Server } from "socket.io";
import { checkOnlyOneGameMaster, positionKey } from "../util";
import { checkMonsterDefeat } from "../death/death";

interface Spell {
  id: string;
  name: string;
  school: string;
  image_path: string;
  range: string;
  target_type: string;
  effect: {
    type: string;
    stat: string;
    value: string | null;
    comment: string;
  };
}

export function getSpell(spellId: string): Spell | undefined {
  return (spells as unknown as Spell[]).find((s) => s.id === spellId);
}

export function getSpellSchool(spell: Spell): spellElement | null {
  const school: spellElement | null = spell
    ? (spellElement as any)[spell.school as keyof typeof spellElement] ?? null
    : null;

  return school;
}

export async function castSpell(
  gameState: GameState,
  player: Player,
  spellId: string,
  position: Position,
  io: Server
) {
  console.log("applying effects of casted spell");

  const spell = getSpell(spellId);
  if (!spell) {
    throw new Error("Spell not found: " + spellId);
  }

  const spellSchool = getSpellSchool(spell);
  if (spellSchool === null) {
    throw new Error("Spell school not found.");
  }

  if (!player.stats) {
    throw new Error("Player stats not found.");
  }

  if (!player.stats.spells || !player.stats.spells.includes(spellSchool)) {
    throw new Error(
      "Player does not know this spell. : " +
        spellSchool +
        " not in " +
        player.stats.spells
    );
  }

  if (player.stats.usedSpells && player.stats.usedSpells.includes(spellId)) {
    throw new Error("Player already used this spell.");
  }

  const playerPosition = gameState.entityPositions.get(player.id);
  if (!playerPosition) {
    throw new Error("Player position not found.");
  }

  if (spell.id.includes("Djinn")) {
    if (spell.id === "Djinn") return; // this spell allows to choose between sub-spells
  }

  if (isPositionVisible(playerPosition, position) === false) {
    throw new Error("Target position is not visible.");
  }

  const target = gameState.positionEntities.get(positionKey(position));
  if (!target && spell.target_type !== "no target") {
    throw new Error("No target found at the specified position.");
  }

  switch (spell.effect.type) {
    case "heal":
      if (player.stats.hp !== undefined && player.stats.maxHp) {
        const healValue = parseInt(spell.effect.value!.replace("+", ""));
        player.stats.hp = Math.min(
          player.stats.hp + healValue,
          player.stats.maxHp
        );
      }
      break;
    case "buff": {
      const statToBuff = spell.effect.stat as keyof typeof player.stats;
      const rawValue = spell.effect.value ?? "0";
      const sign = rawValue[0];
      const parsed = parseInt(rawValue.replace(/[-+*]/, ""));

      switch (sign) {
        case "+":
          applyBuff(player.stats, statToBuff, parsed, (a, b) => a + b);
          break;
        case "-":
          applyBuff(player.stats, statToBuff, parsed, (a, b) => a - b);
          break;
        case "*":
          applyBuff(player.stats, statToBuff, parsed, (a, b) => a * b);
          break;
        default:
          throw new Error("Unknown buff sign: " + sign);
      }
      break;
    }
    case "damage":
      // Damage effect to be implemented
      if (spell.effect.comment === "monster roll red dices") {
        const monsterTarget = gameState.monsters.get(target || "");
        if (!monsterTarget) {
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
        if (monsterTarget.stats?.hp === undefined) {
          throw new Error("Monster target has no health stat.");
        }
        console.log("dealing damages:", damages);
        monsterTarget.stats.hp -= damages;
        checkMonsterDefeat(gameState, monsterTarget);
      }

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
