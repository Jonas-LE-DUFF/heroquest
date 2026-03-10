import React from "react";
import { GameControls } from "../GameControlsComponent";
import { Socket } from "socket.io-client";
import { GameAsJson } from "../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { TileType } from "../../POO/enums/TileType";
import { Direction } from "../../POO/enums/Direction";
import { MonsterCategory } from "../../POO/enums/Categories/MonsterCategory";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { MonsterAsJson } from "../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";

interface RightMenuProps {
  socket: Socket;
  currentGameState: GameAsJson;
  setSelectedType: (type: any) => void;
  selectedType: TileType | Direction | MonsterCategory | null;
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
