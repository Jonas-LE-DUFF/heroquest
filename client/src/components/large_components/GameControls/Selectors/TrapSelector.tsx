import { useState } from "react";
import { TrapType } from "../../../../POO/enums/Board/TrapType";
import { SelectType } from "../../../../POO/types/selectType";
import { Selector } from "./Selector";
import { MenuItem } from "@mui/material";

interface TrapSelectorProps {
  selectedType: SelectType;
  setSelectedType: (type: SelectType) => void;
}

export const TrapSelector = ({
  selectedType,
  setSelectedType,
}: TrapSelectorProps) => {
  const [selectedTrap, setSelectedTrap] = useState<TrapType>(TrapType.PIT_TRAP);

  const renderTrapItems = () => [
    <MenuItem key={1} value={TrapType.PIT_TRAP}>
      Oubliettes
    </MenuItem>,
    <MenuItem key={2} value={TrapType.ROCK_TRAP}>
      Éboulement
    </MenuItem>,
    <MenuItem key={3} value={TrapType.SPEAR_TRAP}>
      Piège à lance
    </MenuItem>,
  ];

  return (
    <>
      <Selector
        selectedType={selectedType}
        checked={() => selectedType !== null && selectedType in TrapType}
        title={"Pièges"}
        baseValue={selectedTrap}
        renderItems={renderTrapItems}
        onRadioChange={() => setSelectedType(selectedTrap)}
        onSelectChange={(value) => {
          setSelectedTrap(value as TrapType);
          setSelectedType(value as TrapType);
        }}
      />
    </>
  );
};
