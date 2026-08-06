import { Dispatch, SetStateAction, useState } from "react";
import { SelectType } from "../../../../POO/types/selectType";
import { getFurnituresAsMenuItems } from "../../../../shared/furnitureUtils";
import { Selector } from "./Selector";
import furnitures from "../../../../shared/game_cards/furnitures.json";
import { InteractionState } from "../../../../view/hooks/useBoardTileClickHandlers";
import { Direction } from "../../../../POO/enums/Direction";
import { useFurnitureRotation } from "../../../../view/hooks/useFurnitureRotation";

interface FurnitureSelectorProps {
  selectedType: SelectType;
  setSelectedType: (type: SelectType) => void;
  setInteraction: Dispatch<SetStateAction<InteractionState>>;
}

export const FurnitureSelector = ({
  selectedType,
  setSelectedType,
  setInteraction,
}: FurnitureSelectorProps) => {
  const [selectedFurniture, setSelectedFurniture] = useState<string>(
    furnitures[0]?.furnitureId || "",
  );

  const [furnitureDirection, setFurnitureDirection] = useState<Direction>(
    Direction.RIGHT,
  );

  useFurnitureRotation(
    furnitureDirection,
    selectedType,
    selectedFurniture,
    setFurnitureDirection,
    setInteraction,
  );
  return (
    <Selector
      selectedType={selectedType}
      checked={() => selectedType === selectedFurniture}
      title={"Meubles"}
      baseValue={selectedFurniture}
      renderItems={getFurnituresAsMenuItems}
      onRadioChange={() => {
        setSelectedType(selectedFurniture);
        setInteraction((prev) => ({
          ...prev,
          targeting: {
            mode: "placeFurniture",
            furnitureType: selectedFurniture,
            direction: furnitureDirection,
          },
        }));
      }}
      onSelectChange={(newSelectedValue) => {
        setSelectedFurniture(newSelectedValue as string);
        setSelectedType(newSelectedValue);
        setInteraction((prev) => ({
          ...prev,
          targeting: {
            mode: "placeFurniture",
            furnitureType: newSelectedValue as string,
            direction: furnitureDirection,
          },
        }));
      }}
    />
  );
};
