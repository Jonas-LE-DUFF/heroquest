import { useState } from "react";
import { Direction } from "../../../../POO/enums/Direction";
import { SelectType } from "../../../../POO/types/selectType";
import { Selector } from "./Selector";
import { MenuItem } from "@mui/material";

interface DoorSelectorProps {
  selectedType: SelectType;
  setSelectedType: (type: SelectType) => void;
}

export const DoorSelector = ({
  selectedType,
  setSelectedType,
}: DoorSelectorProps) => {
  const [selectedDoor, setSelectedDoor] = useState<Direction>(Direction.UP);

  const renderDoorItems = () => [
    <MenuItem key={1} value={Direction.UP}>
      Porte Haut
    </MenuItem>,
    <MenuItem key={2} value={Direction.DOWN}>
      Porte Bas
    </MenuItem>,
    <MenuItem key={3} value={Direction.LEFT}>
      Porte Gauche
    </MenuItem>,
    <MenuItem key={4} value={Direction.RIGHT}>
      Porte Droite
    </MenuItem>,
  ];

  return (
    <>
      <Selector
        selectedType={selectedType}
        checked={() => selectedType !== null && selectedType in Direction}
        title={"Portes"}
        baseValue={selectedDoor}
        renderItems={renderDoorItems}
        onRadioChange={() => setSelectedType(selectedDoor)}
        onSelectChange={(value) => {
          setSelectedDoor(value as Direction);
          setSelectedType(value as Direction);
        }}
      />
    </>
  );
};
