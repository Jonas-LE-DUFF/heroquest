import { Dispatch, SetStateAction } from "react";
import { useLocation } from "react-router-dom";
import "./GameControlsComponent.css";
import { Grid } from "@mui/material";
import MasterControls from "../MasterControlsComponent";
import { TileType } from "../../../POO/enums/Board/TileType";
import { HeroAsJson } from "../../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { MonsterAsJson } from "../../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { GameAsJson } from "../../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { getPlayerIdToPlay } from "../../../shared/serverUtils";
import { PlayerRole } from "../../../POO/enums/PlayerRole";
import { toast } from "react-toastify";
import { SelectType } from "../../../POO/types/selectType";
import { InteractionState } from "../../../view/hooks/useBoardTileClickHandlers";
import { Socket } from "socket.io-client";
import { LocationState } from "../../../POO/types/LocationType";
import ArrowCursorIcon from "/assets/images/icons/actions/arrow-cursor.svg";
import CancelIcon from "/assets/images/icons/actions/cancel.svg";
import MagnifingGlassIcon from "/assets/images/icons/actions/magnifying-glass.svg";

import { MonsterSelector } from "./Selectors/MonsterSelector";
import { FurnitureSelector } from "./Selectors/FurnitureSelector";
import { useUnitMovement } from "../../../view/hooks/useUnitMovement";
import { DoorSelector } from "./Selectors/DoorSelector";
import { TrapSelector } from "./Selectors/TrapSelector";

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

  const unSelect = () => {
    setSelectedType(null);
  };

  const erase = () => {
    setSelectedType(TileType.FLOOR);
  };

  const endTurn = () => {
    socket.emit(
      "end-turn",
      { gameId: currentGameState.id, playerId },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          toast.error(`Erreur lors de la fin du tour: ${response.error}`);
        }
      },
    );
  };

  function revealTrap(): void {
    setInteraction((prev) => ({
      ...prev,
      selectedType: null,
      targeting: { mode: "revealTrap" },
    }));
  }

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
        <button className="warning-button attractive-button" onClick={endTurn}>
          END TURN
        </button>
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
            <div>
              <div className="buttons-container">
                <button
                  onClick={unSelect}
                  className={selectedType === null ? "selected" : ""}
                >
                  <img src={ArrowCursorIcon} alt="Annuler" className="icon" />
                </button>
                <button
                  onClick={erase}
                  className={selectedType === TileType.FLOOR ? "selected" : ""}
                >
                  <img src={CancelIcon} alt="Effacer" className="icon" />
                </button>
                <button onClick={revealTrap}>
                  <img
                    src={MagnifingGlassIcon}
                    alt="Révéler"
                    className="icon"
                  />
                </button>
              </div>
            </div>
            <hr />
          </>
          <MasterControls socket={socket} />
          {isPlayerTurn && (
            <div>
              <button className="warning-button" onClick={endTurn}>
                END TURN
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export { GameControls };
