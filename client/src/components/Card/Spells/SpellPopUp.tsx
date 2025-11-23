import { useState } from "react";
import { spellElement } from "../../../shared/type";
import SpellsComponent from "./SpellsComponent";
import "./SpellsPopUp.css";
import SpellList from "./SpellList";
import { getSpellListForSchool } from "../cardUtils";

interface SpellsPopUpProps {
  socket: any;
  spellSchools: spellElement[] | undefined;
  spellAlreadyUsed: string[] | undefined; // list of spell IDs
  onSpellClick: () => void;
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
    useState<spellElement | null>(null);
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
          <SpellsComponent
            socket={socket}
            spellSchools={spellSchools}
            spellAlreadyUsed={spellAlreadyUsed}
            onSpellClick={(spellElement: spellElement) => {
              setSelectedSpellSchool(spellElement);
              setSpellPage(2);
            }}
            onClose={() => closeSpellPage()}
          />
        );
      case 2:
        const spellList = getSpellListForSchool(
          selectedSpellSchool ?? spellSchools[0]
        );
        return (
          <SpellList
            socket={socket}
            spellList={spellList}
            onSpellClick={() => setSpellPage(3)}
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
