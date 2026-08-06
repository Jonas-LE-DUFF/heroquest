import { useCallback, useEffect } from "react";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { MonsterAsJson } from "../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { PlayerRole } from "../../POO/enums/PlayerRole";
import { Socket } from "socket.io-client";
import { GameAsJson } from "../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { toast } from "react-toastify";
import { Direction } from "../../POO/enums/Direction";

export const useUnitMovement = (
  hero: HeroAsJson | null,
  selectedUnit: MonsterAsJson | HeroAsJson | null,
  role: PlayerRole,
  isPlayerTurn: boolean,
  game: GameAsJson,
  playerId: string,
  socket: Socket,
) => {
  const movePlayer = useCallback(
    (direction: Direction) => {
      if (!hero) {
        console.error("No hero found for the current player");
        return;
      }

      socket.emit(
        "move-unit-one-step",
        {
          gameId: game.id,
          playerId,
          unitId: hero.id,
          direction: direction,
        },
        (response: { success: boolean; error?: string }) => {
          if (!response.success) {
            toast.error(`Erreur de déplacement du joueur: ${response.error}`);
          }
        },
      );
    },
    [game.id, hero, playerId, socket],
  );

  const moveMonster = useCallback(
    (direction: Direction) => {
      if (!selectedUnit || role !== PlayerRole.GAME_MASTER) {
        console.error("No unit selected for movement");
        return;
      }

      socket.emit(
        "move-unit-one-step",
        {
          gameId: game.id,
          playerId,
          unitId: selectedUnit.id,
          direction: direction,
        },
        (response: { success: boolean; error?: string }) => {
          if (!response.success) {
            toast.error(`Erreur de déplacement du monstre: ${response.error}`);
          }
        },
      );
    },
    [game.id, playerId, role, selectedUnit, socket],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      const directionByKey: Record<string, Direction> = {
        ArrowUp: Direction.UP,
        ArrowDown: Direction.DOWN,
        ArrowLeft: Direction.LEFT,
        ArrowRight: Direction.RIGHT,
      };

      const direction = directionByKey[event.key];
      if (!direction) {
        return;
      }

      event.preventDefault();

      if (role === PlayerRole.HERO && isPlayerTurn) {
        movePlayer(direction);
        return;
      }

      if (role === PlayerRole.GAME_MASTER && selectedUnit) {
        moveMonster(direction);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlayerTurn, moveMonster, movePlayer, role, selectedUnit]);
};
