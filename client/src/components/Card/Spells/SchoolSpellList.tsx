import { SpellElement } from "../../../POO/enums/SpellElement";
import { getElementName } from "../../../shared/utils";
import { BackCardComponent, CardComponent } from "../CardComponent";
import { getSpellEllementAsCard } from "../cardUtils";

interface SchoolSpellListProps {
  socket: any;
  spellSchools: SpellElement[];
  spellAlreadyUsed: string[]; // list of spell IDs
  onSpellClick: (spellElement: SpellElement) => void;
  onClose: () => void;
}

const SchoolSpellList: React.FC<SchoolSpellListProps> = ({
  socket,
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
      <div
        key={school}
        className="spell-school"
        role="button"
        onClick={() => onSpellClick(school)}
      >
        <BackCardComponent card={getSpellEllementAsCard(school)} />
      </div>
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
