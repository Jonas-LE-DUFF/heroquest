import React, { useEffect, useState } from "react";
import { CardComponent } from "../CardComponent";
import { getDjinnSpells, getSpellAsCard } from "../cardUtils";
import "./SpellsPopUp.css";

interface SpellListProps {
  spellList: string[];
  usedSpellList: string[];
  onSpellClick: (spell: string) => void;
  onClose: () => void;
  onReturn: (() => void) | undefined;
}

const SpellList: React.FC<SpellListProps> = ({
  spellList,
  usedSpellList,
  onSpellClick,
  onClose,
  onReturn,
}) => {
  const [displayedSpells, setDisplayedSpells] = useState<string[]>(spellList);
  const [onReturnHandler, setOnReturnHandler] = useState<
    (() => void) | undefined
  >(() => onReturn);
  // Keep local display list in sync with parent changes
  useEffect(() => {
    setDisplayedSpells(spellList);
  }, [spellList]);

  if (!displayedSpells) {
    return <div className="spell-view">No spells available</div>;
  }
  const onSpellClickInternal = (spellId: string) => {
    if (spellId === "Djinn") {
      const djinnSpells = getDjinnSpells();
      setDisplayedSpells(djinnSpells);
      setOnReturnHandler(() => {
        setDisplayedSpells(spellList);
        setOnReturnHandler(() => onReturnHandler);
      });
      return; // do nothing when clicking on the main Djinn spell
    }
    onSpellClick(spellId);
  };

  const renderSpellSchools = (spellIds: string[]) => {
    return spellIds.map((spellId) => {
      const isUsed: boolean = usedSpellList.includes(spellId);
      return (
        <button
          key={spellId}
          className={"spell-card " + (isUsed ? "used-spell" : "")}
          onClick={isUsed ? undefined : () => onSpellClickInternal(spellId)}
        >
          <CardComponent card={getSpellAsCard(spellId)} />
        </button>
      );
    });
  };
  return (
    <div className="spell-view">
      <button className="close-button" onClick={onClose}>
        X
      </button>
      {onReturnHandler !== undefined && (
        <button className="return-button" onClick={onReturnHandler}>
          Retour
        </button>
      )}
      {renderSpellSchools(displayedSpells)}
    </div>
  );
};

export default SpellList;
