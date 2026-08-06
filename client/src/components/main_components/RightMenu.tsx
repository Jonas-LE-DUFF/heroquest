import React, { Dispatch, SetStateAction } from "react";
import { GameControls } from "../large_components/GameControls/GameControlsComponent";
import { Socket } from "socket.io-client";
import { GameAsJson } from "../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { MonsterAsJson } from "../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { SelectType } from "../../POO/types/selectType";
import { InteractionState } from "../../view/hooks/useBoardTileClickHandlers";

interface RightMenuProps {
  socket: Socket;
  currentGameState: GameAsJson;
  setSelectedType: (type: SelectType) => void;
  selectedType: SelectType;
  selectedUnit: HeroAsJson | MonsterAsJson | null;
  hero: HeroAsJson | null;
  setInteraction: Dispatch<SetStateAction<InteractionState>>;
}

const RightMenu: React.FC<RightMenuProps> = ({
  socket,
  currentGameState,
  setSelectedType,
  selectedType,
  selectedUnit,
  hero,
  setInteraction,
}) => {
  return (
    <GameControls
      socket={socket}
      currentGameState={currentGameState}
      setSelectedType={setSelectedType}
      selectedType={selectedType}
      selectedUnit={selectedUnit}
      hero={hero}
      setInteraction={setInteraction}
    />
  );
};

export default RightMenu;
