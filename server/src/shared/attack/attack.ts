import { Server, Socket } from "socket.io";
import { rollFightDice } from "../../controllers/dicesControllers";
import { getEquipmentAttackDice, getEquipmentRange } from "../equipments";
import {
  ClientToServerEvents,
  diceFace,
  GameState,
  Monster,
  Player,
  ServerToClientEvents,
  SocketData,
} from "../type";
import { checkUnitDefeat } from "../death/death";
import { convertGameStateAsSendableGameState, getGameMasterId, isPlayer } from "../util";

export function attack(
  io: Server<ClientToServerEvents, ServerToClientEvents, SocketData, any>,
  socket: Socket,
  gameState: GameState,
  attackerId: string,
  targetId: string,
  weaponId: string,
): { success: boolean; damageDealt?: number; error?: string } {
  if (!gameState) {
    return { success: false, error: "Game state not found." };
  }
  const callerPlayer = gameState.players.get(socket.id);
  if (!callerPlayer) {
    return { success: false, error: "Caller player not found." };
  }
  const role = callerPlayer.role;
  if (role === "game-master") {
    const attacker = gameState.monsters.get(attackerId);
    if (!attacker) {
      console.log("No attacker monster selected.");
      return { success: false, error: "No attacker monster selected." };
    }
    const target = gameState.players.get(targetId);
    if (!target) {
      console.log("No target player selected.");
      return { success: false, error: "No target player selected." };
    }
    const range = "melee";
    // no need to check for weapon
    // monsters only attack adjacent ennemies
    fight(attacker, target, weaponId, io, gameState);
    return { success: true };
  } else {
    // role === "hero"
    if (attackerId !== socket.id) {
      console.log("Player can only attack with their own character.");
      return {
        success: false,
        error: "Player can only attack with their own character.",
      };
    }
    const attacker = callerPlayer;
    const target = gameState.monsters.get(targetId);
    if (!target) {
      console.log("No target monster selected.");
      return { success: false, error: "No target monster selected." };
    }

    if (!attacker.stats?.equipments) {
      console.log("Attacker has no equipments.");
      return { success: false, error: "Attacker has no equipments." };
    }

    if (!attacker.stats?.equipments?.includes(weaponId)) {
      console.log(`Selected weapon : ${weaponId}`);
      console.log(`Attacker equipments : ${attacker.stats?.equipments}`);
      console.log("Selected weapon not found in player's equipments.");
      return {
        success: false,
        error: "Selected weapon not found in player's equipments.",
      };
    }

    const weaponRange = getEquipmentRange(weaponId);
    const attackerPos = gameState.entityPositions.get(attacker.id);
    const targetPos = gameState.entityPositions.get(target.id);
    if (!attackerPos || !targetPos) {
      console.log("Could not find positions for attacker or target.");
      return {
        success: false,
        error: "Could not find positions for attacker or target.",
      };
    }
    const rangeX = Math.abs(attackerPos.x - targetPos.x);
    const rangeY = Math.abs(attackerPos.y - targetPos.y);
    const distance = rangeX + rangeY;
    switch (weaponRange) {
      case "melee":
        if (distance > 1) {
          console.log("Selected weapon is melee and target is out of range.");
          return {
            success: false,
            error: "Selected weapon is melee and target is out of range.",
          };
        }
        break;
      case "ranged":
        if (distance < 2) {
          console.log("Selected weapon is ranged and target is too close.");
          return {
            success: false,
            error: "Selected weapon is ranged and target is too close.",
          };
        }
        break;
      case "long_melee":
        if (rangeX > 1 || rangeY > 1) {
          // diagonal allowed
          console.log(
            "Selected weapon is long melee and target is out of range.",
          );
          return {
            success: false,
            error: "Selected weapon is long melee and target is out of range.",
          };
        }
        break;
      case "throwable":
        break;
      default:
        console.log("Selected weapon has invalid range type.");
        return {
          success: false,
          error: "Selected weapon has invalid range type.",
        };
    }
    // check if the weapon can reach the targeted unit
    fight(attacker, target, weaponId, io, gameState);
    return { success: true };
  }
}

async function fight(
  attacker: Monster | Player,
  target: Monster | Player,
  weaponId: string,
  io: any,
  gameState: GameState,
): Promise<void> {

  const attackerDices = attacker.stats ? (attacker.stats.nbAttackDice ?? 0) : 0;
  const weaponDices = getEquipmentAttackDice(weaponId);

  const attackResults = await rollFightDice(
    io,
    attacker.id,
    gameState,
    attackerDices,
  );
  if (!attackResults.success || !attackResults.results) {
    console.error("Attack dice roll failed:", attackResults.error);
    return;
  }
  const successfulAttacks = attackResults.results.filter(
    (result) => result === diceFace.Hit,
  ).length;

  const defenderDices = target.stats ? (target.stats.nbDefenseDice ?? 0) : 0;

  const gameMasterId = getGameMasterId(gameState);
  if (!gameMasterId) {
    console.error("Game master not found for defense dice roll.");
    return;
  }

  const defenseResults = await rollFightDice(
    io,
    gameMasterId,
    gameState,
    defenderDices,
  );
  if (!defenseResults.success || !defenseResults.results) {
    console.error("Defense dice roll failed:", defenseResults.error);
    return;
  }

  let defenceDiceType;
  if( isPlayer(target)){
    defenceDiceType = diceFace.WhiteShield;
  }else{
    defenceDiceType = diceFace.BlackShield;
  }

  const successfulDefenses = defenseResults.results.filter(
    (result) => result === defenceDiceType,
  ).length;

  const damageDealt = Math.max(0, successfulAttacks - successfulDefenses);
  console.log(
    `Attacker ${attacker.id} rolled ${successfulAttacks} successful attacks.`,
  );
  console.log(
    `Target ${target.id} rolled ${successfulDefenses} successful defenses.`,
  );
  console.log(`Total damage dealt to Target ${target.id}: ${damageDealt}.`);

  if (!target.stats?.hp) {
    console.log(`Target ${target.id} has no HP stat.`);
    return;
  }
  target.stats.hp -= damageDealt;
  if (target.stats.hp < 0) {
    target.stats.hp = 0;
  }
  gameState = checkUnitDefeat(gameState, target);

  console.log(`monster after attack:`, gameState.monsters);

  // Emit to the GAME ROOM, not to target.id (monsters don't have socket rooms)
  io.to(gameState.id).emit("stats-updated", {
    entityId: target.id,
    newStats: target.stats,
    isPlayer: isPlayer(target),
  });

  console.log(
    `Attack resolved: Attacker ${attacker.id} dealt ${damageDealt} damage to Target ${target.id}.`,
  );
}
