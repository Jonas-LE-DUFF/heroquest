import { useEffect, useState } from "react";
import { CardComponent } from "../CardComponent";
import { getDjinnSpells, getSpellAsCard } from "../cardUtils";
import "./SpellsPopUp.css";

interface SpellListProps {
  socket: any;
  spellList: string[];
  usedSpellList: string[];
  onSpellClick: (spell: string) => void;
  onClose: () => void;
  onReturn: (() => void) | undefined;
}

const SpellList: React.FC<SpellListProps> = ({
  socket,
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
        <div
          key={spellId}
          className={"spell-card " + (isUsed ? "used-spell" : "")}
          role="button"
          onClick={isUsed ? undefined : () => onSpellClickInternal(spellId)}
        >
          <CardComponent card={getSpellAsCard(spellId)} />
        </div>
      );
    });
  };
  return (
    <div className="spell-view">
      <div className="closeButton">
        <button onClick={onClose}>X</button>
      </div>
      {onReturnHandler !== undefined && (
        <div className="returnButton">
          <button onClick={onReturnHandler}>Retour</button>
        </div>
      )}
      {renderSpellSchools(displayedSpells)}
    </div>
  );
};

export default SpellList;
