import {
  Dispatch,
  SetStateAction,
  JSX,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import "./GameControlsComponent.css";
import { Grid, MenuItem, Radio, Select } from "@mui/material";
import { getMonsterIconPath } from "../../shared/utils";
import { monsterClassFr } from "../../shared/languages/frenchEnums";
import MasterControls from "./MasterControlsComponent";
import { TileType } from "../../POO/enums/Board/TileType";
import { MonsterCategory } from "../../POO/enums/Categories/MonsterCategory";
import { Direction } from "../../POO/enums/Direction";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { MonsterAsJson } from "../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { GameAsJson } from "../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { getPlayerIdToPlay } from "../../shared/serverUtils";
import { PlayerRole } from "../../POO/enums/PlayerRole";
import { toast } from "react-toastify";
import { TrapType } from "../../POO/enums/Board/TrapType";
import { SelectType } from "../../POO/types/selectType";
import { InteractionState } from "../../view/hooks/useBoardTileClickHandlers";
import { Socket } from "socket.io-client";
import { LocationState } from "../../POO/types/LocationType";
import ArrowCursorIcon from "/assets/images/icons/actions/arrow-cursor.svg";
import CancelIcon from "/assets/images/icons/actions/cancel.svg";
import MagnifingGlassIcon from "/assets/images/icons/actions/magnifying-glass.svg";

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

  const isElementsShown: Map<string, boolean> = new Map();
  isElementsShown.set("masterControls", false);

  const isPlayerTurn = getPlayerIdToPlay(currentGameState) === playerId;

  const [selectedMonster, setSelectedMonster] = useState<MonsterCategory>(
    MonsterCategory.Goblin,
  );
  const [selectedFurniture, setSelectedFurniture] = useState<TileType>(
    TileType.FURNITURE,
  );
  const [selectedDoor, setSelectedDoor] = useState<Direction>(Direction.UP);
  const [selectedTrap, setSelectedTrap] = useState<TrapType>(TrapType.PIT_TRAP);

  const movePlayer = useCallback(
    (direction: Direction) => {
      if (!hero) {
        console.error("No hero found for the current player");
        return;
      }

      socket.emit(
        "move-unit-one-step",
        {
          gameId: currentGameState.id,
          playerId,
          unitId: hero.id,
          direction: direction,
        },
        (response: { success: boolean; error?: string }) => {
          if (!response.success) {
            toast.error(`Erreur de déplacement du joueur: ${response.error}`);
          }
        },
      );
    },
    [currentGameState.id, hero, playerId, socket],
  );

  const moveMonster = useCallback(
    (direction: Direction) => {
      if (!selectedUnit || role !== PlayerRole.GAME_MASTER) {
        console.error("No unit selected for movement");
        return;
      }

      socket.emit(
        "move-unit-one-step",
        {
          gameId: currentGameState.id,
          playerId,
          unitId: selectedUnit.id,
          direction: direction,
        },
        (response: { success: boolean; error?: string }) => {
          if (!response.success) {
            toast.error(`Erreur de déplacement du monstre: ${response.error}`);
          }
        },
      );
    },
    [currentGameState.id, playerId, role, selectedUnit, socket],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      const directionByKey: Record<string, Direction> = {
        ArrowUp: Direction.UP,
        ArrowDown: Direction.DOWN,
        ArrowLeft: Direction.LEFT,
        ArrowRight: Direction.RIGHT,
      };

      const direction = directionByKey[event.key];
      if (!direction) {
        return;
      }

      event.preventDefault();

      if (role === PlayerRole.HERO && isPlayerTurn) {
        movePlayer(direction);
        return;
      }

      if (role === PlayerRole.GAME_MASTER && selectedUnit) {
        moveMonster(direction);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlayerTurn, moveMonster, movePlayer, role, selectedUnit]);

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

  // module-scope helper: list numeric enum values for MonsterCategory
  const MONSTER_TYPES: MonsterCategory[] = Object.values(
    MonsterCategory,
  ).filter((v) => typeof v === "number") as MonsterCategory[];

  const renderMonsterButtons = () => {
    if (MONSTER_TYPES.length === 0) {
      return null;
    }

    const buttons: JSX.Element[] = [];
    for (const mType of MONSTER_TYPES) {
      const img = getMonsterIconPath(mType);
      const name = monsterClassFr[mType];
      buttons.push(
        <MenuItem
          value={mType}
          className={`monster-item ${selectedType === mType ? "selected" : ""}`}
        >
          <img src={img} alt={name} className="monster-img" />
          {name}
        </MenuItem>,
      );
    }
    return buttons;
  };

  function revealTrap(): void {
    setInteraction((prev) => ({
      ...prev,
      selectedType: null,
      targeting: { mode: "revealTrap" },
    }));
  }

  return (
    <div>
      <div className="game-controls hero">
        <h3>Actions héros</h3>
        {isPlayerTurn && (
          <div>
            <button className="warning-button" onClick={endTurn}>
              END TURN
            </button>
          </div>
        )}
      </div>
      <div className="game-controls game-master">
        {role === PlayerRole.GAME_MASTER && (
          <>
            <Grid container alignItems="center">
              <Grid size={1}>
                <Radio
                  checked={
                    selectedType != null && selectedType in MonsterCategory
                  }
                  onChange={() => setSelectedType(selectedMonster)}
                  name="selectedType"
                />
              </Grid>
              <Grid size={3}>
                <h5>Monstres</h5>
              </Grid>
              <Grid size={8}>
                <Select
                  value={selectedMonster}
                  onChange={(e) => {
                    setSelectedMonster(e.target.value as MonsterCategory);
                    setSelectedType(e.target.value as MonsterCategory);
                  }}
                >
                  {renderMonsterButtons()}
                </Select>
              </Grid>
              <Grid size={1}>
                <Radio
                  checked={
                    selectedType !== null &&
                    selectedType !== TileType.FLOOR &&
                    selectedType in TileType
                  }
                  onChange={() => setSelectedType(selectedFurniture)}
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
                    setSelectedFurniture(e.target.value as TileType);
                    setSelectedType(e.target.value as TileType);
                  }}
                >
                  <MenuItem value={TileType.WALL}>Mur</MenuItem>
                  <MenuItem value={TileType.FURNITURE}>Meuble</MenuItem>
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
                  {/* TODO : Trouver un manière de rendre ce bouton selectable */}
                </button>
              </div>
            </div>
            <hr />
          </>
        )}
        {role === PlayerRole.GAME_MASTER && <MasterControls socket={socket} />}
      </div>
    </div>
  );
};
export { GameControls };
