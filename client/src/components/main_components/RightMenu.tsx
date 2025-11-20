import React from "react";
import { GameControls } from "../GameControlsComponent";

interface RightMenuProps {
  socket: any;
  currentGameState: any;
  setSelectedType: (type: any) => void;
  monsterType: any;
  setMonsterType: (type: any) => void;
  selectedUnit: any;
}

const RightMenu: React.FC<RightMenuProps> = ({
  socket,
  currentGameState,
  setSelectedType,
  monsterType,
  setMonsterType,
  selectedUnit,
}) => {
  return (
    <div>
      <GameControls
        socket={socket}
        game={currentGameState}
        setSelectedType={setSelectedType}
        monsterType={monsterType}
        setMonsterType={setMonsterType}
        selectedUnit={selectedUnit}
      />
    </div>
  );
};

export default RightMenu;
