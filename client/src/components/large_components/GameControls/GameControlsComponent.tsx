import { Dispatch, SetStateAction, useState } from "react";
import { useLocation } from "react-router-dom";
import "./GameControlsComponent.css";
import { Grid, MenuItem, Radio, Select } from "@mui/material";
import MasterControls from "../MasterControlsComponent";
import { TileType } from "../../../POO/enums/Board/TileType";
import { Direction } from "../../../POO/enums/Direction";
import { HeroAsJson } from "../../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { MonsterAsJson } from "../../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { GameAsJson } from "../../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { getPlayerIdToPlay } from "../../../shared/serverUtils";
import { PlayerRole } from "../../../POO/enums/PlayerRole";
import { toast } from "react-toastify";
import { TrapType } from "../../../POO/enums/Board/TrapType";
import { SelectType } from "../../../POO/types/selectType";
import { InteractionState } from "../../../view/hooks/useBoardTileClickHandlers";
import { Socket } from "socket.io-client";
import { LocationState } from "../../../POO/types/LocationType";
import ArrowCursorIcon from "/assets/images/icons/actions/arrow-cursor.svg";
import CancelIcon from "/assets/images/icons/actions/cancel.svg";
import MagnifingGlassIcon from "/assets/images/icons/actions/magnifying-glass.svg";

import furnitures from "../../../shared/game_cards/furnitures.json";
import { getFurnituresAsMenuItems } from "../../../shared/furnitureUtils";
import { MonsterSelector } from "./MonsterSelector";
import { useUnitMovement } from "../../../view/hooks/useUnitMovement";
import { useFurnitureRotation } from "../../../view/hooks/useFurnitureRotation";

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

  const [selectedFurniture, setSelectedFurniture] = useState<string>(
    furnitures[0]?.furnitureId || "",
  );
  const [furnitureDirection, setFurnitureDirection] = useState<Direction>(
    Direction.RIGHT,
  );
  const [selectedDoor, setSelectedDoor] = useState<Direction>(Direction.UP);
  const [selectedTrap, setSelectedTrap] = useState<TrapType>(TrapType.PIT_TRAP);

  useFurnitureRotation(
    furnitureDirection,
    selectedType,
    selectedFurniture,
    setFurnitureDirection,
    setInteraction,
  );

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
              <Grid size={1}>
                <Radio
                  checked={
                    selectedFurniture !== null &&
                    selectedType === selectedFurniture
                  }
                  onChange={() => {
                    setSelectedType(selectedFurniture);
                    setInteraction((prev) => ({
                      ...prev,
                      targeting: {
                        mode: "placeFurniture",
                        furnitureType: selectedFurniture,
                        direction: furnitureDirection,
                      },
                    }));
                  }}
                  name="selectedType"
                />
              </Grid>
              <Grid size={3}>
                <h5>Meubles</h5>
              </Grid>
              <Grid size={8}>
                <Select
                  value={selectedFurniture}
                  onChange={(e) => {
                    const furnitureType = e.target.value;
                    setSelectedFurniture(furnitureType);
                    setSelectedType(furnitureType);
                    setInteraction((prev) => ({
                      ...prev,
                      targeting: {
                        mode: "placeFurniture",
                        furnitureType,
                        direction: furnitureDirection,
                      },
                    }));
                  }}
                >
                  {getFurnituresAsMenuItems()}
                </Select>
              </Grid>
              <Grid size={1}>
                <Radio
                  checked={selectedType !== null && selectedType in Direction}
                  onChange={() => setSelectedType(selectedDoor)}
                  name="selectedType"
                />
              </Grid>
              <Grid size={3}>
                <h5>Portes</h5>
              </Grid>
              <Grid size={8}>
                <Select
                  value={selectedDoor}
                  onChange={(e) => {
                    setSelectedDoor(e.target.value as Direction);
                    setSelectedType(e.target.value as Direction);
                  }}
                >
                  <MenuItem value={Direction.UP}>Porte Haut</MenuItem>
                  <MenuItem value={Direction.DOWN}>Porte Bas</MenuItem>
                  <MenuItem value={Direction.LEFT}>Porte Gauche</MenuItem>
                  <MenuItem value={Direction.RIGHT}>Porte Droite</MenuItem>
                </Select>
              </Grid>
              <Grid size={1}>
                <Radio
                  checked={selectedType !== null && selectedType in TrapType}
                  onChange={() => setSelectedType(selectedTrap)}
                  name="selectedType"
                />
              </Grid>
              <Grid size={3}>
                <h5>Pièges</h5>
              </Grid>
              <Grid size={8}>
                <Select
                  value={selectedTrap}
                  onChange={(e) => {
                    setSelectedTrap(e.target.value as TrapType);
                    setSelectedType(e.target.value as TrapType);
                  }}
                >
                  <MenuItem value={TrapType.PIT_TRAP}>Oubliettes</MenuItem>
                  <MenuItem value={TrapType.ROCK_TRAP}>Éboulement</MenuItem>
                  <MenuItem value={TrapType.SPEAR_TRAP}>Piège à lance</MenuItem>
                </Select>
              </Grid>
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
