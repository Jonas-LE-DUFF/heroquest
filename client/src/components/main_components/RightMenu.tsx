import React from "react";
import { GameControls } from "../GameControlsComponent";
import { Socket } from "socket.io-client";
import {
  Direction,
  GameState,
  Monster,
  monsterClass,
  Player,
  tileType,
} from "../../shared/type";

interface RightMenuProps {
  socket: Socket;
  currentGameState: GameState;
  setSelectedType: (type: any) => void;
  selectedType: tileType | Direction | monsterClass | null;
  selectedUnit: Player | Monster | null;
  setTargetMode: (value: boolean) => void;
  setSelectedWeapon: (weaponId: string | null) => void;
  selectedWeapon: string | null;
}

const RightMenu: React.FC<RightMenuProps> = ({
  socket,
  currentGameState,
  setSelectedType,
  selectedType,
  selectedUnit,
  setTargetMode,
  setSelectedWeapon,
  selectedWeapon,
}) => {
  return (
    <div>
      <GameControls
        socket={socket}
        game={currentGameState}
        setSelectedType={setSelectedType}
        selectedType={selectedType}
        selectedUnit={selectedUnit}
        setTargetMode={setTargetMode}
        setSelectedWeapon={setSelectedWeapon}
        selectedWeapon={selectedWeapon}
      />
    </div>
  );
};

export default RightMenu;
