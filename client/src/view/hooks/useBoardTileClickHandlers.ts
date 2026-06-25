import { Dispatch, SetStateAction, useCallback } from "react";
import { toast } from "react-toastify";
import { PositionAsJson } from "../../POO/interfaces/ClassAsJson/PositionAsJson";
import { SelectType } from "../../POO/types/selectType";
import { getTileByPosition } from "../../shared/boardUtils";
import { BoardAsJson } from "../../POO/interfaces/ClassAsJson/Board/BoardAsJson";
import { GameAsJson } from "../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { PlayerService } from "../../POO/PlayerService";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { Socket } from "socket.io-client";

export type TargetingState =
  | { mode: "none" }
  | { mode: "placingSelectedType" }
  | { mode: "attack" }
  | { mode: "spell"; spellId: string }
  | { mode: "disarmTrap" }
  | { mode: "revealTrap" };

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
  playerId: string;
  socket: Socket;
  hero: HeroAsJson | null;
  setStatsVisible: Dispatch<SetStateAction<boolean>>;
  setGame: Dispatch<SetStateAction<GameAsJson>>;
}

const useBoardTileClickHandlers = ({
  interaction,
  setInteraction,
  game,
  playerId,
  socket,
  hero,
  setStatsVisible,
  setGame,
}: UseBoardTileClickHandlersProps) => {
  const getDefaultTargetingState = useCallback(
    (): TargetingState =>
      interaction.selectedType ? { mode: "placingSelectedType" } : { mode: "none" },
    [interaction.selectedType],
  );

  const handleSpellTileClick = useCallback(
    (position: PositionAsJson) => {
      if (interaction.targeting.mode !== "spell") {
        return;
      }

      socket.emit(
        "cast-spell",
        {
          gameId: game.id,
          playerId: playerId,
          spellId: interaction.targeting.spellId,
          position: position,
        },
        (response: { success: boolean; error?: string }) => {
          if (!response.success) {
            toast.error("Failed to cast spell: " + response.error);
          }
        },
      );
      setInteraction((prev) => ({ ...prev, targeting: getDefaultTargetingState() }));
    },
    [interaction.targeting, socket, game.id, playerId, setInteraction, getDefaultTargetingState],
  );

  const handleAttackTileClick = useCallback(
    (position: PositionAsJson) => {
      const targetId = getTileByPosition(
        position,
        game.gameState.board,
      )?.unitId;
      const target = game.gameState.Units.find((u) => u.id === targetId);
      if (!target) {
        setInteraction((prev) => ({ ...prev, targeting: getDefaultTargetingState() }));
        return;
      }

      socket.emit(
        "attack",
        {
          gameId: game.id,
          playerId: playerId,
          attackerId: hero?.id,
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
      setInteraction((prev) => ({ ...prev, targeting: getDefaultTargetingState() }));
    },
    [game, socket, hero, playerId, setInteraction, getDefaultTargetingState],
  );

  const handleDefaultTileClick = useCallback(
    (position: PositionAsJson) => {
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
    },
    [interaction.selectedPosition, setInteraction, setStatsVisible, game.gameState.board],
  );

  const handlePlaceSelectedTypeTileClick = useCallback(
    (position: PositionAsJson) => {
      const selectedType = interaction.selectedType;

      handleDefaultTileClick(position);

      if (!selectedType) {
        return;
      }

      socket.emit(
        "place-element",
        {
          gameId: game.id,
          playerId: playerId,
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
              gameState: { ...prev.gameState, board: response.data ?? prev.gameState.board },
            } as GameAsJson;
          });
        },
      );
    },
    [interaction.selectedType, handleDefaultTileClick, game.id, socket, playerId, setGame],
  );

  const handleDisarmTrapTileClick = useCallback(
    (position: PositionAsJson) => {
      socket.emit(
        "disarm-trap",
        {
          gameId: game.id,
          playerId: playerId,
          heroId: hero?.id,
          position,
        },
        (response: { success: boolean; error?: string }) => {
          if (!response.success) {
            toast.error("Failed to disarm trap: " + response.error);
          }
        },
      );
      setInteraction((prev) => ({ ...prev, targeting: getDefaultTargetingState() }));
    },
    [game.id, hero, socket, playerId, setInteraction, getDefaultTargetingState],
  );

  const handleRevealTrapTileClick = useCallback(
    (position: PositionAsJson) => {
      console.log("Attempting to reveal trap at position:", position);
      socket.emit(
        "reveal-trap",
        {
          gameId: game.id,
          playerId: playerId,
          position,
        },
        (response: { success: boolean; error?: string }) => {
          if (!response.success) {
            toast.error("Failed to reveal trap: " + response.error);
          }else {
            toast.success("Trap revealed successfully");
          }
        },
      );
      setInteraction((prev) => ({ ...prev, targeting: getDefaultTargetingState() }));
    },
    [game.id, socket, playerId, setInteraction, getDefaultTargetingState],
  );

  const handleTileClick = useCallback(
    (position: PositionAsJson) => {
      const handlersByMode: Record<TargetingState["mode"], () => void> = {
        none: () => handleDefaultTileClick(position),
        placingSelectedType: () => handlePlaceSelectedTypeTileClick(position),
        attack: () => handleAttackTileClick(position),
        spell: () => handleSpellTileClick(position),
        disarmTrap: () => handleDisarmTrapTileClick(position),
        revealTrap: () => handleRevealTrapTileClick(position),
      };

      handlersByMode[interaction.targeting.mode]();
    },
    [
      interaction.targeting.mode,
      handleSpellTileClick,
      handleAttackTileClick,
      handleDefaultTileClick,
      handlePlaceSelectedTypeTileClick,
      handleDisarmTrapTileClick,
      handleRevealTrapTileClick,
    ],
  );

  return { handleTileClick };
};

export default useBoardTileClickHandlers;
