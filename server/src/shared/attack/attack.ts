import { Server, Socket } from "socket.io";
import { rollFightDice } from "../../controllers/dicesControllers";
import { getEquipmentAttackDice, getEquipmentRange } from "../equipments";
import { ClientToServerEvents, diceFace, GameState, ServerToClientEvents, SocketData } from "../type";

function attack(io: Server<ClientToServerEvents, ServerToClientEvents, SocketData, any>, socket: Socket, gameState: GameState, attackerId: string, targetId: string, weaponId: string): 
{ success: boolean; damageDealt?: number; error?: string } {
    const callerPlayer = gameState.players.get(socket.id);
    if(!callerPlayer) {
        return { success: false, error: "Caller player not found." };
    }
    const role = callerPlayer.role;
    if(role === "game-master") {
        const attacker = gameState.monsters.get(attackerId);
        if(!attacker) {
          console.log("No attacker monster selected.");
          return { success: false, error: "No attacker monster selected."};
        }
        const target = gameState.players.get(targetId);
        if(!target){
          console.log("No target player selected.");
          return { success: false, error: "No target player selected."};
        }
        const range = "melee";
        // no need to check for weapon
        // monsters only attack adjacent ennemies
        fight(attacker, target, weaponId, io, gameState);
        return { success: true };
      }else{// role === "hero"
        if(attackerId !== socket.id){
          console.log("Player can only attack with their own character.");
          return { success: false, error: "Player can only attack with their own character."};
        }
        const attacker = callerPlayer
        const target = gameState.monsters.get(targetId);
        if(!target){
          console.log("No target monster selected.");
          return { success: false, error: "No target monster selected."};
        }

        if(!attacker.stats?.equipments?.includes(weaponId)){
          console.log("Selected weapon not found in player's equipments.");
          return { success: false, error: "Selected weapon not found in player's equipments."};
        }

        const weaponRange = getEquipmentRange(weaponId);
        const attackerPos = gameState.entityPositions.get(attacker.id);
        const targetPos = gameState.entityPositions.get(target.id);
        if(!attackerPos || !targetPos) {
        console.log("Could not find positions for attacker or target.");
        return { success: false, error: "Could not find positions for attacker or target." };
      }
      const rangeX = Math.abs(attackerPos.x - targetPos.x);
      const rangeY = Math.abs(attackerPos.y - targetPos.y);
      const distance = rangeX + rangeY;
      switch(weaponRange) {
        case "melee":
          if(distance > 1) {
            console.log("Selected weapon is melee and target is out of range.");
            return { success: false, error: "Selected weapon is melee and target is out of range."};
          }
            break;
        case "ranged":
          if(distance < 2) {
            console.log("Selected weapon is ranged and target is too close.");
            return { success: false, error: "Selected weapon is ranged and target is too close."};
          }
            break;
        case "long_melee":
          if(rangeX > 1 || rangeY > 1){ // diagonal allowed
            console.log("Selected weapon is long melee and target is out of range.");
            return { success: false, error: "Selected weapon is long melee and target is out of range."};
          }
            break;
        case "throwable":
            break;
        default:
          console.log("Selected weapon has invalid range type.");
          return { success: false, error: "Selected weapon has invalid range type."};
      }
      // check if the weapon can reach the targeted unit
      fight(attacker, target, weaponId, io, gameState);
      return { success: true };
    }
}

async function fight(attacker: any, target: any, weaponId: string, io: any, gameState: GameState): Promise<void> {
    const attackerDices = attacker.stats ? attacker.stats.nbAttackDice ?? 0 : 0;
    const weaponDices = getEquipmentAttackDice(weaponId);

    const attackResults = await rollFightDice(io, attacker.id, gameState, attackerDices);
    if(!attackResults.success || !attackResults.results) {
        console.error("Attack dice roll failed:", attackResults.error);
        return;
    }
    const successfulAttacks = attackResults.results.filter((result) => result === diceFace.Hit).length;

    const defenderDices = target.stats ? target.stats.nbDefenseDice ?? 0 : 0;

    const defenseResults = await rollFightDice(io, target.id, gameState, defenderDices);
    if(!defenseResults.success || !defenseResults.results) {
        console.error("Defense dice roll failed:", defenseResults.error);
        return;
    }
    const successfulDefenses = defenseResults.results.filter((result) => result === diceFace.Hit).length;
}