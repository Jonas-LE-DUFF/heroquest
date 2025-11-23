import { spellElement } from "../../../shared/type";
import { getElementName } from "../../../shared/utils";
import { CardComponent } from "../CardComponent";
import "./SpellsComponent.css";

interface SpellsComponentProps {
  socket: any;
  spellSchools: spellElement[] | undefined;
  spellAlreadyUsed: string[] | undefined; // list of spell IDs
  onSpellClick: () => void;
}

const SpellsComponent: React.FC<SpellsComponentProps> = ({
  socket,
  spellSchools,
  spellAlreadyUsed,
  onSpellClick,
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
        onClick={onSpellClick}
      >
        <CardComponent
          socket={socket}
          cardName={getElementName(school, "en")}
          cardType="back"
        />
      </div>
    ));
  };
  return <div className="spell-view">{renderSpellSchools(spellSchools)}</div>;
};

export default SpellsComponent;
