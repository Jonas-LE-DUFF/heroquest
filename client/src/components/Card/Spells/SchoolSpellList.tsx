import { SpellElement } from "../../../POO/enums/SpellElement";
import { BackCardComponent } from "../CardComponent";
import { getSpellEllementAsCard } from "../cardUtils";
import React from "react";

interface SchoolSpellListProps {
  spellSchools: SpellElement[];
  spellAlreadyUsed: string[]; // list of spell IDs
  onSpellClick: (spellElement: SpellElement) => void;
  onClose: () => void;
}

const SchoolSpellList: React.FC<SchoolSpellListProps> = ({
  spellSchools,
  spellAlreadyUsed,
  onSpellClick,
  onClose,
}) => {
  if (!spellSchools) {
    return <div className="spell-view">No spells available</div>;
  }
  if (spellSchools.length === 0) {
    return <div className="spell-view">No spells learned</div>;
  }
  if (spellAlreadyUsed === undefined) {
    spellAlreadyUsed = [];
  }
  const renderSpellSchools = (spellSchools: SpellElement[]) => {
    return spellSchools.map((school) => (
      <button
        key={school}
        className="spell-card"
        onClick={() => onSpellClick(school)}
      >
        <BackCardComponent card={getSpellEllementAsCard(school)} />
      </button>
    ));
  };
  return (
    <div className="spell-view">
      <div className="closeButton">
        <button onClick={onClose}>X</button>
      </div>
      {renderSpellSchools(spellSchools)}
    </div>
  );
};

export default SchoolSpellList;
