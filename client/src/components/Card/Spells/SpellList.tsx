import { CardComponent } from "../CardComponent";
import "./SpellsPopUp.css";

interface SpellListProps {
  socket: any;
  spellList: string[];
  onSpellClick: () => void;
  onClose: () => void;
  onReturn: (() => void) | undefined;
}

const SpellList: React.FC<SpellListProps> = ({
  socket,
  spellList,
  onSpellClick,
  onClose,
  onReturn,
}) => {
  if (!spellList) {
    return <div className="spell-view">No spells available</div>;
  }
  const renderSpellSchools = (spellList: string[]) => {
    return spellList.map((spellId) => (
      <div
        key={spellId}
        className="spell-school"
        role="button"
        onClick={onSpellClick}
      >
        <CardComponent socket={socket} cardName={spellId} cardType="spell" />
      </div>
    ));
  };
  return (
    <div className="spell-view">
      <div className="closeButton">
        <button onClick={onClose}>X</button>
      </div>
      {onReturn !== undefined && (
        <div className="returnButton">
          <button onClick={onReturn}>Retour</button>
        </div>
      )}
      {renderSpellSchools(spellList)}
    </div>
  );
};

export default SpellList;
