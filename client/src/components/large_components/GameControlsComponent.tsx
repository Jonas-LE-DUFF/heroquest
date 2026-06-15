import { Dispatch, SetStateAction, JSX } from "react";
import { useLocation } from "react-router-dom";
import Dices from "../dices/HeroQuestDicesComponent";
import "./GameControlsComponent.css";
import {
  Accordion,
  AccordionSummary,
  Grid,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { getMonsterIconPath } from "../../shared/utils";
import RedDices from "../dices/RedDicesComponent";
import { monsterClassFr } from "../../shared/languages/frenchEnums";
import MasterControls from "./MasterControlsComponent";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { getEquipmentName } from "../../shared/equipments";
import { TileType } from "../../POO/enums/Board/TileType";
import { MonsterCategory } from "../../POO/enums/Categories/MonsterCategory";
import { Direction } from "../../POO/enums/Direction";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { MonsterAsJson } from "../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { getPlayerIdToPlay } from "../../shared/serverUtils";
import { PlayerRole } from "../../POO/enums/PlayerRole";
import { toast } from "react-toastify";
import { TrapType } from "../../POO/enums/Board/TrapType";
import { SelectType } from "../../POO/types/selectType";
import { InteractionState } from "../../view/hooks/useBoardTileClickHandlers";
import { Socket } from "socket.io-client";
import { LocationState } from "../../POO/types/LocationType";

interface GameControlsProps {
  socket: Socket;
  setInteraction: Dispatch<SetStateAction<InteractionState>>;
  setSelectedType: (type: SelectType) => void; //Direction -> door placement
  selectedType: SelectType;
  selectedUnit: HeroAsJson | MonsterAsJson | null;
  setSelectedWeapon: (weaponId: string | null) => void;
  selectedWeapon: string | null;
  hero: HeroAsJson | null;
}

const GameControls = ({
  socket,
  setInteraction,
  setSelectedType,
  selectedType,
  selectedUnit,
  setSelectedWeapon,
  selectedWeapon,
  hero,
}: GameControlsProps) => {
  const state = useLocation().state as LocationState;
  const { playerId, game } = state;
  const role = game.players.find((p) => p.id === playerId)?.role ?? PlayerRole.HERO;

  const isElementsShown: Map<string, boolean> = new Map();
  isElementsShown.set("monsterSelector", false);
  isElementsShown.set("miscellaneousButtons", false);
  isElementsShown.set("doorButtons", false);
  isElementsShown.set("playerDices", true);
  isElementsShown.set("monsterDices", true);
  isElementsShown.set("masterControls", false);

  const isPlayerTurn = getPlayerIdToPlay(game) === playerId;

  const movePlayer = (direction: Direction) => {
    socket.emit(
      "move-unit-one-step",
      {
        gameId: game.id,
        playerId,
        unitId: playerId,
        direction: direction,
      },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          toast.error(`Erreur de déplacement du joueur: ${response.error}`);
        }
      },
    );
  };

  const moveMonster = (direction: Direction) => {
    if (!selectedUnit || role !== PlayerRole.GAME_MASTER) {
      console.error("No unit selected for movement");
      return;
    }

    socket.emit(
      "move-unit-one-step",
      {
        gameId: game.id,
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
  };

  const selectMonster = (monster: MonsterCategory) => {
    setSelectedType(monster);
  };

  const putWall = () => {
    setSelectedType(TileType.WALL);
  };

  const putFurniture = () => {
    setSelectedType(TileType.FURNITURE);
  };

  const unSelect = () => {
    setSelectedType(null);
  };

  const erase = () => {
    setSelectedType(TileType.FLOOR);
  };

  const putDoor = (direction: Direction) => {
    setSelectedType(direction);
  };

  const putTrap = (trapType: TrapType) => {
    setSelectedType(trapType);
  };

  const endTurn = () => {
    socket.emit(
      "end-turn",
      { gameId: game.id, playerId },
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

  const renderMovementControls = (role: PlayerRole) => {
    if (role === PlayerRole.HERO)
      return (
        <div className="movement-controls">
          <div></div>
          <button
            className="classic-button"
            onClick={() => movePlayer(Direction.UP)}
          >
            ⬆️
          </button>
          <div></div>
          <button
            className="classic-button"
            onClick={() => movePlayer(Direction.LEFT)}
          >
            ⬅️
          </button>
          <button
            className="classic-button"
            onClick={() => movePlayer(Direction.DOWN)}
          >
            ⬇️
          </button>
          <button
            className="classic-button"
            onClick={() => movePlayer(Direction.RIGHT)}
          >
            ➡️
          </button>
        </div>
      );
    if (role === PlayerRole.GAME_MASTER)
      return (
        <div className="movement-controls">
          <div></div>
          <button
            className="classic-button"
            onClick={() => moveMonster(Direction.UP)}
          >
            ⬆️
          </button>
          <div></div>
          <button
            className="classic-button"
            onClick={() => moveMonster(Direction.LEFT)}
          >
            ⬅️
          </button>
          <button
            className="classic-button"
            onClick={() => moveMonster(Direction.DOWN)}
          >
            ⬇️
          </button>
          <button
            className="classic-button"
            onClick={() => moveMonster(Direction.RIGHT)}
          >
            ➡️
          </button>
        </div>
      );
  };

  return (
    <div>
      <div className="game-controls hero">
        <Accordion sx={{ background: "inherit" }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <Typography component="span">Actions Héros</Typography>
          </AccordionSummary>
          <h3>Actions</h3>
          {role === PlayerRole.HERO &&
            isPlayerTurn &&
            renderMovementControls(role)}
          <div className="dices-section">
            <RedDices
              socket={socket}
              role={PlayerRole.HERO}
            />
            <Dices
              socket={socket}
              role={PlayerRole.HERO}
            />
          </div>
          {role === PlayerRole.HERO && hero?.equipment && (
            <div className="attack-choice">
              Arme selectionnée :
              <select
                className="weapons"
                id="weapons-select"
                onChange={(e) => {
                  setSelectedWeapon(e.target.value);
                }}
                value={selectedWeapon ?? ""}
              >
                {hero?.equipment?.weapons?.map((weapon) => {
                  return (
                    <option key={weapon.id} value={weapon.id}>
                      {getEquipmentName(weapon.name)}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
          {isPlayerTurn && (
            <div>
              <button className="warning-button" onClick={endTurn}>
                END TURN
              </button>
            </div>
          )}
        </Accordion>
      </div>
      <div className="game-controls game-master">
        <Accordion sx={{ color: "white", background: "inherit" }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel4-content"
            id="panel4-header"
          >
            <Typography component="span">Actions Maître du Jeu</Typography>
          </AccordionSummary>
          <div className="dices-section">
            <RedDices
              socket={socket}
              role={PlayerRole.GAME_MASTER}
            />
            <Dices
              socket={socket}
              role={PlayerRole.GAME_MASTER}
            />
          </div>
        </Accordion>
        {role === PlayerRole.GAME_MASTER && (
          <div>
            <Accordion
              sx={{ color: "white", background: "inherit", padding: "5px" }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel2-content"
                id="panel2-header"
              >
                <Typography component="span">Monstres</Typography>
              </AccordionSummary>

              <Select
                sx={{ background: "white", display: "flex", justifyContent: "center", alignItems: "center",  }}
                value={selectedType}
                onChange={(e) => {
                  if (
                    e.target.value === "" &&
                    !(e.target.value in MonsterCategory)
                  ) {
                    setSelectedType(null);
                    return;
                  }
                  selectMonster(e.target.value as MonsterCategory);
                }}
              >
                {renderMonsterButtons()}
              </Select>
            </Accordion>

            <Accordion sx={{ color: "white", background: "inherit" }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel3-content"
                id="panel3-header"
              >
                <Typography component="span">Murs et Meubles</Typography>
              </AccordionSummary>
              <div className="two-button-container">
                <button className="classic-button" onClick={putWall}>
                  Mur
                </button>
                <button className="classic-button" onClick={putFurniture}>
                  Meuble
                </button>
              </div>
              <div className="two-button-container">
                <button className="classic-button" onClick={unSelect}>
                  Annuler
                </button>
                <button className="classic-button" onClick={erase}>
                  Effacer
                </button>
              </div>
            </Accordion>
            <Accordion sx={{ color: "white", background: "inherit" }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel3-content"
                id="panel3-header"
              >
                <Typography component="span">Portes</Typography>
              </AccordionSummary>
              <Grid container sx={{ width: "fit-content" }}>
                <Grid size={6}>
                  <button
                    className="classic-button"
                    onClick={() => putDoor(Direction.UP)}
                  >
                    Porte Haut
                  </button>
                </Grid>
                <Grid size={6}>
                  <button
                    className="classic-button"
                    onClick={() => putDoor(Direction.DOWN)}
                  >
                    Porte Bas
                  </button>
                </Grid>
                <Grid size={6}>
                  <button
                    className="classic-button"
                    onClick={() => putDoor(Direction.LEFT)}
                  >
                    Porte Gauche
                  </button>
                </Grid>
                <Grid size={6}>
                  <button
                    className="classic-button"
                    onClick={() => putDoor(Direction.RIGHT)}
                  >
                    Porte Droite
                  </button>
                </Grid>
              </Grid>
            </Accordion>
            <Accordion sx={{ color: "white", background: "inherit" }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel3-content"
                id="panel3-header"
              >
                <Typography component="span">Pièges</Typography>
              </AccordionSummary>
              <Grid container sx={{ width: "fit-content" }}>
                <Grid size={4}>
                  <button
                    className="classic-button"
                    onClick={() => putTrap(TrapType.PIT_TRAP)}
                  >
                    Oubliettes
                  </button>
                </Grid>
                <Grid size={4}>
                  <button
                    className="classic-button"
                    onClick={() => putTrap(TrapType.ROCK_TRAP)}
                  >
                    Éboulement
                  </button>
                </Grid>
                <Grid size={4}>
                  <button
                    className="classic-button"
                    onClick={() => putTrap(TrapType.SPEAR_TRAP)}
                  >
                    Piège à lance
                  </button>
                </Grid>
                <Grid size={12}>
                  <button
                    className="classic-button"
                    onClick={() => {
                      setInteraction((prev) => ({
                        ...prev,
                        selectedType: null,
                        targeting: { mode: "revealTrap" },
                      }));
                    }}
                  >
                    révéler piège
                  </button>
                </Grid>
              </Grid>
            </Accordion>
          </div>
        )}
        {role === PlayerRole.GAME_MASTER &&
          selectedUnit !== null &&
          renderMovementControls(role)}
        {role === PlayerRole.GAME_MASTER && (
          <Accordion sx={{ color: "white", background: "inherit" }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel5-content"
              id="panel5-header"
            >
              <Typography component="span">Contrôles Maître du Jeu</Typography>
            </AccordionSummary>
            <div>
              <MasterControls socket={socket}/>
            </div>
          </Accordion>
        )}
      </div>
    </div>
  );
};

export { GameControls };
