import { requireGameExists } from "../guards/requireGameExists";
import { requirePlayerTurn } from "../guards/requirePlayerTurn";
import { Position } from "../POO/classes/Position/Position";
import { GameService } from "../services/GameService";

export function registerGameActionsHandlers(
  socket: any,
  io: any,
) {
 ///** common player and game master actions **///
    //end-turn
    socket.on("end-turn", (data: { gameId: string }) => {
      console.log("end-turn");

      const game = GameService.getGame(data.gameId);

      if (game!.getCurrentPlayerTurnId() !== socket.id) {
        console.error("can't end turn, it's not your turn...");
        return;
      }

      game!.endTurn();
      if (player.role !== "game-master" && player.stats?.statusEffects) {
        const newStatusEffects = player.stats?.statusEffects?.filter(
          (statusEffect) => {
            if (!statusEffect) {
              return false;
            }
            if (statusEffect.duration === "until the end of next turn") {
              return false;
            }
            return true;
          },
        );
        player.stats.statusEffects = newStatusEffects;
      } else {
        console.info(
          "end of game-master's turn removing status effects of monsters",
        );
        for (const monster of game.monsters.values()) {
          monster.stats.statusEffects = monster.stats.statusEffects?.filter(
            (statusEffect) => {
              if (!statusEffect) {
                return false;
              }
              if (statusEffect.duration === "until the end of next turn") {
                return false;
              }
              return true;
            },
          );
        }
      }
      game.currentTurn = nextPlayer;

      io.to(data.gameId).emit("game-state-update", {
        game: game,
      });
    });

    // cast-spell
    socket.on(
      "cast-spell",
      async (
        data: { gameId: string; spellId: string; position: Position },
        callback: (response: { success: boolean; error?: string }) => void,
      ) => {
        console.debug("casting spell", data);
        const { gameId, spellId, position } = data;
        let game = GameService.getGame(gameId);
        if (!requireGameExists(gameId)){
          return callback({
            success: false,
            error: "game couldn't be found in cast-spell",
          });
        }
        if (!requirePlayerTurn(socket, game!)) {
          return callback({
            success: false,
            error: "it's not your turn to play in cast-spell",
          });
        }
        try{
            const castingPlayer = game!.getCurrentPlayerTurn();
            console.debug("spell cast by player", castingPlayer?.name);
        } catch (error){
          return callback({
            success: false,
            error: "player casting spell couldn't be found : " + (error as Error).message,
          });
        }
        try {
          await castSpell(
            gameState,
            castingPlayer,
            spellId,
            position,
            socket,
            io,
          );
        } catch (error) {
          const errorMessage = (error as Error).message;
          console.error("error while casting spell :", errorMessage);
          return callback({
            success: false,
            error: "You couldn't cast this spell because : " + errorMessage,
          });
        }

        // Marking spell as used for the player
        if (castingPlayer.stats) {
          if (!castingPlayer.stats.usedSpells) {
            castingPlayer.stats.usedSpells = [];
          }
          castingPlayer.stats.usedSpells.push(spellId);
        }

        console.log("spell casted successfully Player :", castingPlayer.stats);
        if (!gameState) return;
        io.to(gameId).emit("game-state-update", {
          game: game,
        });

        return callback({ success: true });
      },
    );
}