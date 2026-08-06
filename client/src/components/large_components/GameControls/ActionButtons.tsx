import { Dispatch, SetStateAction } from "react";
import { TileType } from "../../../POO/enums/Board/TileType";
import { SelectType } from "../../../POO/types/selectType";
import { InteractionState } from "../../../view/hooks/useBoardTileClickHandlers";

import ArrowCursorIcon from "/assets/images/icons/actions/arrow-cursor.svg";
import CancelIcon from "/assets/images/icons/actions/cancel.svg";
import MagnifingGlassIcon from "/assets/images/icons/actions/magnifying-glass.svg";

interface ActionButtonsProps {
  selectedType: SelectType;
  setSelectedType: (type: SelectType) => void;
  setInteraction: Dispatch<SetStateAction<InteractionState>>;
}

export const ActionButtons = ({
  selectedType,
  setSelectedType,
  setInteraction,
}: ActionButtonsProps) => {
  const unSelect = () => {
    setSelectedType(null);
  };

  const erase = () => {
    setSelectedType(TileType.FLOOR);
  };

  function revealTrap(): void {
    setInteraction((prev) => ({
      ...prev,
      selectedType: null,
      targeting: { mode: "revealTrap" },
    }));
  }
  return (
    <div className="buttons-container">
      <button
        onClick={unSelect}
        className={selectedType === null ? "selected" : ""}
      >
        <img src={ArrowCursorIcon} alt="Annuler" className="icon" />
      </button>
      <button
        onClick={erase}
        className={selectedType === TileType.FLOOR ? "selected" : ""}
      >
        <img src={CancelIcon} alt="Effacer" className="icon" />
      </button>
      <button onClick={revealTrap}>
        <img src={MagnifingGlassIcon} alt="Révéler" className="icon" />
      </button>
    </div>
  );
};
