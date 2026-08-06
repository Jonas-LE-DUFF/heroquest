import { Dispatch, SetStateAction } from "react";
import { useLocation } from "react-router-dom";
import "./GameControlsComponent.css";
import { Grid } from "@mui/material";
import MasterControls from "../MasterControlsComponent";
import { HeroAsJson } from "../../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { MonsterAsJson } from "../../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { GameAsJson } from "../../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { getPlayerIdToPlay } from "../../../shared/serverUtils";
import { PlayerRole } from "../../../POO/enums/PlayerRole";
import { SelectType } from "../../../POO/types/selectType";
import { InteractionState } from "../../../view/hooks/useBoardTileClickHandlers";
import { Socket } from "socket.io-client";
import { LocationState } from "../../../POO/types/LocationType";

import { MonsterSelector } from "./Selectors/MonsterSelector";
import { FurnitureSelector } from "./Selectors/FurnitureSelector";
import { useUnitMovement } from "../../../view/hooks/useUnitMovement";
import { DoorSelector } from "./Selectors/DoorSelector";
import { TrapSelector } from "./Selectors/TrapSelector";
import { ActionButtons } from "./ActionButtons";
import { EndTurnButton } from "../../small_components/EndTurnButton";

interface GameControlsProps {
  socket: Socket;
  currentGameState: GameAsJson;
  setInteraction: Dispatch<SetStateAction<InteractionState>>;
  setSelectedType: (type: SelectType) => void; //Direction -> door placement
  selectedType: SelectType;
  selectedUnit: HeroAsJson | MonsterAsJson | null;
  hero: HeroAsJson | null;
}

const GameControls = ({
  socket,
  currentGameState,
  setInteraction,
  setSelectedType,
  selectedType,
  selectedUnit,
  hero,
}: GameControlsProps) => {
  const state = useLocation().state as LocationState;
  const { playerId } = state;
  const role =
    currentGameState.players.find((p) => p.id === playerId)?.role ??
    PlayerRole.HERO;

  const isPlayerTurn = getPlayerIdToPlay(currentGameState) === playerId;

  useUnitMovement(
    hero,
    selectedUnit,
    role,
    isPlayerTurn,
    currentGameState,
    playerId,
    socket,
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {role === PlayerRole.HERO && isPlayerTurn && (
        <EndTurnButton
          socket={socket}
          gameId={currentGameState.id}
          playerId={playerId}
          className="attractive-button"
        />
      )}
      {role === PlayerRole.GAME_MASTER && (
        <div className="game-controls game-master">
          <h3>Actions</h3>
          <>
            <Grid container alignItems="center">
              <MonsterSelector
                selectedType={selectedType}
                setSelectedType={setSelectedType}
              />
              <FurnitureSelector
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                setInteraction={setInteraction}
              />
              <DoorSelector
                selectedType={selectedType}
                setSelectedType={setSelectedType}
              />
              <TrapSelector
                selectedType={selectedType}
                setSelectedType={setSelectedType}
              />
            </Grid>
            <ActionButtons
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              setInteraction={setInteraction}
            />
            <hr />
          </>
          <MasterControls socket={socket} />
          {isPlayerTurn && (
            <div>
              <EndTurnButton
                socket={socket}
                gameId={currentGameState.id}
                playerId={playerId}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export { GameControls };
