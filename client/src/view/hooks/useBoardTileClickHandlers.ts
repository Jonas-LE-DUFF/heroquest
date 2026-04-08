import { Dispatch, SetStateAction, useCallback } from "react";
import { toast } from "react-toastify";
import { PositionAsJson } from "../../POO/interfaces/ClassAsJson/PositionAsJson";
import { SelectType } from "../../POO/types/selectType";
import { getTileByPosition } from "../../shared/boardUtils";
import { BoardAsJson } from "../../POO/interfaces/ClassAsJson/Board/BoardAsJson";
import { GameAsJson } from "../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { PlayerService } from "../../POO/PlayerService";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";

export type TargetingState =
  | { mode: "none" }
  | { mode: "attack" }
  | { mode: "spell"; spellId: string }
  | { mode: "disarmTrap" };

export interface InteractionState {
  selectedType: SelectType;
  selectedPosition: PositionAsJson | null;
  selectedEntityId: string | null;
  targeting: TargetingState;
}

interface UseBoardTileClickHandlersProps {
  interaction: InteractionState;
  setInteraction: Dispatch<SetStateAction<InteractionState>>;
  game: GameAsJson;
  socket: any;
  hero: HeroAsJson | null;
  setStatsVisible: Dispatch<SetStateAction<boolean>>;
  setGame: Dispatch<SetStateAction<GameAsJson>>;
}

const useBoardTileClickHandlers = ({
  interaction,
  setInteraction,
  game,
  socket,
  hero,
  setStatsVisible,
  setGame,
}: UseBoardTileClickHandlersProps) => {
  const handleSpellTileClick = useCallback(
    (position: PositionAsJson) => {
      if (interaction.targeting.mode !== "spell") {
        return;
      }

      socket.emit(
        "cast-spell",
        {
          gameId: game.id,
          spellId: interaction.targeting.spellId,
          position: position,
        },
        (response: { success: boolean; error?: string }) => {
          if (!response.success) {
            toast.error("Failed to cast spell: " + response.error);
          }
        },
      );
      setInteraction((prev) => ({ ...prev, targeting: { mode: "none" } }));
    },
    [interaction.targeting, socket, game.id, setInteraction],
  );

  const handleAttackTileClick = useCallback(
    (position: PositionAsJson) => {
      const targetId = getTileByPosition(
        position,
        game.gameState.board,
      )?.unitId;
      const target = game.gameState.Units.find((u) => u.id === targetId);
      if (!target) {
        setInteraction((prev) => ({ ...prev, targeting: { mode: "none" } }));
        return;
      }

      socket.emit(
        "attack",
        {
          gameId: game.id,
          attackerId: socket.id,
          targetId: target.id,
          weaponId: PlayerService.getHeroSelectedWeapon(hero) ?? undefined,
        },
        (response: { success: boolean; error?: string }) => {
          if (response.success) {
            console.log("Attack executed successfully");
          } else {
            toast.error("Failed to execute attack: " + response.error);
          }
        },
      );
      setInteraction((prev) => ({ ...prev, targeting: { mode: "none" } }));
    },
    [game, socket, hero, setInteraction],
  );

  const handleDefaultTileClick = useCallback(
    (position: PositionAsJson, selectedType: SelectType) => {
      if (
        interaction.selectedPosition !== null &&
        interaction.selectedPosition.x === position.x &&
        interaction.selectedPosition.y === position.y
      ) {
        setInteraction((prev) => ({
          ...prev,
          selectedPosition: null,
          selectedEntityId: null,
        }));
        setStatsVisible(false);
      } else {
        const idAtPos = getTileByPosition(position, game.gameState.board)?.unitId;
        if (!idAtPos) {
          setStatsVisible(false);
        }
        setInteraction((prev) => ({
          ...prev,
          selectedPosition: position,
          selectedEntityId: idAtPos ?? null,
        }));
      }

      if (!selectedType) {
        return;
      }
      socket.emit(
        "place-element",
        {
          gameId: game.id,
          position,
          selectedType,
        },
        (response: { success: boolean; error?: string; data: BoardAsJson }) => {
          if (!response.success) {
            toast.error(`Failed to place element: ${response.error}`);
          }
          setGame((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              gameState: { ...prev.gameState, board: response.data },
            } as GameAsJson;
          });
        },
      );
    },
    [interaction.selectedPosition, game, socket, setInteraction, setStatsVisible, setGame],
  );

  const handleDisarmTrapTileClick = useCallback(
    (position: PositionAsJson) => {
      socket.emit(
        "disarm-trap",
        {
          gameId: game.id,
          heroId: hero?.id,
          position,
        },
        (response: { success: boolean; error?: string }) => {
          if (!response.success) {
            toast.error("Failed to disarm trap: " + response.error);
          }
        },
      );
      setInteraction((prev) => ({ ...prev, targeting: { mode: "none" } }));
    },
    [game.id, hero, socket, setInteraction],
  );

  const handleTileClick = useCallback(
    (position: PositionAsJson, selectedType: SelectType) => {
      const handlersByMode: Record<TargetingState["mode"], () => void> = {
        none: () => handleDefaultTileClick(position, selectedType),
        attack: () => handleAttackTileClick(position),
        spell: () => handleSpellTileClick(position),
        disarmTrap: () => handleDisarmTrapTileClick(position),
      };

      handlersByMode[interaction.targeting.mode]();
    },
    [
      interaction.targeting.mode,
      handleSpellTileClick,
      handleAttackTileClick,
      handleDefaultTileClick,
    ],
  );

  return { handleTileClick };
};

export default useBoardTileClickHandlers;
