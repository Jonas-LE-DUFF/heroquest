import React from "react";
import { GameControls } from "../large_components/GameControlsComponent";
import { Socket } from "socket.io-client";
import { GameAsJson } from "../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { MonsterAsJson } from "../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { SelectType } from "../../POO/types/selectType";

interface RightMenuProps {
  socket: Socket;
  currentGameState: GameAsJson;
  setSelectedType: (type: any) => void;
  selectedType: SelectType;
  selectedUnit: HeroAsJson | MonsterAsJson | null;
  setTargetMode: (value: boolean) => void;
  setSelectedWeapon: (weaponId: string | null) => void;
  selectedWeapon: string | null;
  hero: HeroAsJson | null;
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
  hero,
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
        hero={hero}
      />
    </div>
  );
};

export default RightMenu;
