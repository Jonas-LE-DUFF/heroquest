import { CardComponent } from "../CardComponent";
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
  if (!spellList) {
    return <div className="spell-view">No spells available</div>;
  }
  console.log("Rendering SpellList with spells: ", spellList);
  console.log("Used spells: ", usedSpellList);

  const renderSpellSchools = (spellList: string[]) => {
    return spellList.map((spellId) => {
      const isUsed: boolean = usedSpellList.includes(spellId);
      return (
        <div
          key={spellId}
          className={"spell-school " + (isUsed ? "used-spell" : "")}
          role="button"
          onClick={isUsed ? undefined : () => onSpellClick(spellId)}
        >
          <CardComponent socket={socket} cardName={spellId} cardType="spell" />
        </div>
      );
    });
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
