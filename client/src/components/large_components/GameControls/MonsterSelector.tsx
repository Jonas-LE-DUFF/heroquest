import { JSX, useState } from "react";
import { MonsterCategory } from "../../../POO/enums/Categories/MonsterCategory";
import { getMonsterIconPath } from "../../../shared/utils";
import { monsterClassFr } from "../../../shared/languages/frenchEnums";
import { MenuItem } from "@mui/material";
import { SelectType } from "../../../POO/types/selectType";
import { Selector } from "./Selector";

interface MonsterSelectorProps {
  selectedType: SelectType | null;
  setSelectedType: (type: SelectType) => void;
}

export const MonsterSelector = ({
  selectedType,
  setSelectedType,
}: MonsterSelectorProps) => {
  const [selectedMonster, setSelectedMonster] = useState<MonsterCategory>(
    MonsterCategory.Goblin,
  );

  const MONSTER_TYPES: MonsterCategory[] = Object.values(
    MonsterCategory,
  ).filter((v) => typeof v === "number") as MonsterCategory[];

  const renderMonsterButtons = () => {
    if (MONSTER_TYPES.length === 0) {
      return null;
    }

    const buttons: JSX.Element[] = [];
    for (const mType of MONSTER_TYPES) {
      const img = getMonsterIconPath(mType);
      const name = monsterClassFr[mType];
      buttons.push(
        <MenuItem
          value={mType}
          className={`monster-item ${selectedType === mType ? "selected" : ""}`}
        >
          <img src={img} alt={name} className="monster-img" />
          {name}
        </MenuItem>,
      );
    }
    return buttons;
  };

  return (
    <Selector
      selectedType={selectedType}
      checked={() => selectedType === selectedMonster}
      title="Monstres"
      baseValue={selectedMonster}
      renderItems={renderMonsterButtons}
      onRadioChange={() => setSelectedType(selectedMonster)}
      onSelectChange={(value) => {
        setSelectedMonster(value as MonsterCategory);
        setSelectedType(value);
      }}
    />
  );
};
