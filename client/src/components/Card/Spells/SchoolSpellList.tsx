import { spellElement } from "../../../shared/type";
import { getElementName } from "../../../shared/utils";
import { CardComponent } from "../CardComponent";

interface SchoolSpellListProps {
  socket: any;
  spellSchools: spellElement[];
  spellAlreadyUsed: string[]; // list of spell IDs
  onSpellClick: (spellElement: spellElement) => void;
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
  const renderSpellSchools = (spellSchools: spellElement[]) => {
    return spellSchools.map((school) => (
      <div
        key={school}
        className="spell-school"
        role="button"
        onClick={() => onSpellClick(school)}
      >
        <CardComponent
          socket={socket}
          cardName={getElementName(school, "en")}
          cardType="back"
        />
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
