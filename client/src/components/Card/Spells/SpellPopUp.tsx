import { useState } from "react";
import SchoolSpellList from "./SchoolSpellList";
import "./SpellsPopUp.css";
import SpellList from "./SpellList";
import { getSpellListForSchool } from "../cardUtils";
import { SpellElement } from "../../../POO/enums/SpellElement";

interface SpellsPopUpProps {
  socket: any;
  spellSchools: SpellElement[] | undefined;
  spellAlreadyUsed: string[] | undefined; // list of spell IDs
  onSpellClick: (selectedSpell: string) => void;
  closeSpellPage: () => void;
}

const SpellsPopUp: React.FC<SpellsPopUpProps> = ({
  socket,
  spellSchools,
  spellAlreadyUsed,
  onSpellClick,
  closeSpellPage,
}) => {
  const [spellPage, setSpellPage] = useState<number>(1);
  const [selectedSpellSchool, setSelectedSpellSchool] =
    useState<SpellElement | null>(null);
  // spellPage 1 => spell schools
  // spellPage 2 => spells in a school
  // spellPage 3 => spell details (when clicking on a spell)
  // spellPage 4 => all the spells (in order to view them all) // may not be necessary
  const goToPreviousPage = () => {
    if (spellPage > 1) {
      setSpellPage(spellPage - 1);
    }
  };

  const renderPage = () => {
    if (!spellSchools) {
      return <div className="spell-view">No spells available</div>;
    }
    if (spellSchools.length === 0) {
      return <div className="spell-view">No spells learned</div>;
    }
    if (spellSchools.length === 1 && spellPage === 1) {
      setSelectedSpellSchool(spellSchools[0]);
      setSpellPage(2); // automatically go to spell list if only one school
    }
    if (spellAlreadyUsed === undefined) {
      spellAlreadyUsed = [];
    }
    console.log("Rendering spell page: ", spellPage);
    switch (spellPage) {
      case 1:
        return (
          <SchoolSpellList
            socket={socket}
            spellSchools={spellSchools}
            spellAlreadyUsed={spellAlreadyUsed}
            onSpellClick={(spellElement: SpellElement) => {
              setSelectedSpellSchool(spellElement);
              setSpellPage(2);
              console.log("Selected spell school: ", spellElement);
            }}
            onClose={() => closeSpellPage()}
          />
        );
      case 2:
        const spellList = getSpellListForSchool(
          selectedSpellSchool ?? spellSchools[0],
        );
        return (
          <SpellList
            socket={socket}
            spellList={spellList}
            usedSpellList={spellAlreadyUsed}
            onSpellClick={(spell) => {
              onSpellClick(spell);
              closeSpellPage();
            }}
            onClose={() => closeSpellPage()}
            onReturn={
              spellSchools.length === 1 ? undefined : () => goToPreviousPage()
            }
          />
        );

      // Add cases for spellPage 2, 3, and 4 as needed
      default:
        return <div>Invalid page</div>;
    }
  };

  return <>{renderPage()}</>;
};

export default SpellsPopUp;
