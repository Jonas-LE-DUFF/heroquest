import { Dispatch, SetStateAction, useEffect } from "react";
import { Direction } from "../../POO/enums/Direction";
import { InteractionState } from "./useBoardTileClickHandlers";
import { SelectType } from "../../POO/types/selectType";

export const useFurnitureRotation = (
  furnitureDirection: Direction,
  selectedType: SelectType | null,
  selectedFurniture: string,
  setFurnitureDirection: (direction: Direction) => void,
  setInteraction: Dispatch<SetStateAction<InteractionState>>,
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const directionInClockwiseOrder: Direction[] = [
        Direction.UP,
        Direction.RIGHT,
        Direction.DOWN,
        Direction.LEFT,
      ];

      if (
        (event.key === "r" || event.key === "R") &&
        selectedType === selectedFurniture
      ) {
        console.log("Rotating furniture direction");
        event.preventDefault();
        const newDirection = (() => {
          const currentIndex =
            directionInClockwiseOrder.indexOf(furnitureDirection);
          const nextIndex =
            (currentIndex + 1) % directionInClockwiseOrder.length;
          return directionInClockwiseOrder[nextIndex];
        })();
        console.log(`New furniture direction: ${newDirection}`);
        setFurnitureDirection(newDirection);
        setInteraction((prev) => ({
          ...prev,
          targeting: {
            mode: "placeFurniture",
            furnitureType: selectedFurniture,
            direction: newDirection,
          },
        }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    furnitureDirection,
    selectedType,
    selectedFurniture,
    setInteraction,
    setFurnitureDirection,
  ]);
};
