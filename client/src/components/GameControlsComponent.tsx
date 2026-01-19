import React, { useState, useEffect, JSX } from "react";
import { useLocation } from "react-router-dom";
import {
  Direction,
  GameState,
  Monster,
  monsterClass,
  Player,
  tileType,
} from "../shared/type";
import Dices from "./dices/HeroQuestDicesComponent";
import "./GameControlsComponent.css";
import {
  Accordion,
  AccordionSummary,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material";
import { getMonsterIconPath } from "../shared/utils";
import RedDices from "./dices/RedDicesComponent";
import { monsterClassFr } from "../shared/languages/frenchEnums";
import MasterControls from "./MasterControlsComponent";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { getEquipmentName } from "../shared/equipments";

interface GameControlsProps {
  socket: any;
  game: GameState;
  setSelectedType: (type: tileType | Direction | monsterClass | null) => void; //Direction -> door placement
  selectedType: tileType | Direction | monsterClass | null;
  selectedUnit: Player | Monster | null;
  setTargetMode: (value: boolean) => void;
  setSelectedWeapon: (weaponId: string | null) => void;
  selectedWeapon: string | null;
}

const GameControls = ({
  socket,
  game,
  setSelectedType,
  selectedType,
  selectedUnit,
  setTargetMode,
  setSelectedWeapon,
  selectedWeapon,
}: GameControlsProps) => {
  const location = useLocation();
  const gameId = location.state.gameId;
  const role = location.state.role;

  const [message, setMessage] = useState("");

  const isElementsShown: Map<string, boolean> = new Map();
  isElementsShown.set("monsterSelector", false);
  isElementsShown.set("miscellaneousButtons", false);
  isElementsShown.set("doorButtons", false);
  isElementsShown.set("playerDices", true);
  isElementsShown.set("monsterDices", true);
  isElementsShown.set("masterControls", false);

  const [player, setPlayer] = useState(game.players.get(socket.id));

  useEffect(() => {
    if (!game) return;

    setPlayer(game.players.get(socket.id));

    socket.on("player-moved", (data: any) => {
      setMessage(`${data.playerName} s'est déplacé`);
    });

    return () => {
      socket.off("player-moved");
    };
  }, [socket, game]);

  const movePlayer = (direction: Direction) => {
    socket.emit(
      "move-unit-one-step",
      {
        gameId,
        unitId: socket.id,
        direction: direction,
      },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          alert(`Erreur de déplacement du joueur: ${response.error}`);
        }
      }
    );
  };

  const moveMonster = (direction: Direction) => {
    if (!selectedUnit || role !== "game-master") {
      console.error("No unit selected for movement");
      return;
    }

    socket.emit(
      "move-unit-one-step",
      {
        gameId,
        unitId: selectedUnit.id,
        direction: direction,
      },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          alert(`Erreur de déplacement du monstre: ${response.error}`);
        }
      }
    );
  };

  const selectMonster = (monster: monsterClass) => {
    setSelectedType(monster);
  };

  const putWall = () => {
    setSelectedType(tileType.wall);
  };

  const putFurniture = () => {
    setSelectedType(tileType.furniture);
  };

  const unSelect = () => {
    setSelectedType(null);
  };

  const erase = () => {
    setSelectedType(tileType.empty);
  };

  const putTopDoor = () => {
    setSelectedType(Direction.UP);
  };

  const putBottomDoor = () => {
    setSelectedType(Direction.DOWN);
  };

  const putLeftDoor = () => {
    setSelectedType(Direction.LEFT);
  };

  const putRightDoor = () => {
    setSelectedType(Direction.RIGHT);
  };

  const endTurn = () => {
    socket.emit("end-turn", { gameId: gameId });
  };

  // module-scope helper: list numeric enum values for monsterClass
  const MONSTER_TYPES: monsterClass[] = Object.values(monsterClass).filter(
    (v) => typeof v === "number"
  ) as monsterClass[];

  const renderMonsterButtons = () => {
    if (MONSTER_TYPES.length === 0) {
      return null;
    }

    const buttons: JSX.Element[] = [];
    for (const mType of MONSTER_TYPES) {
      const img = getMonsterIconPath(mType);
      const name = monsterClassFr[mType];
      buttons.push(
        <Grid key={mType} size={3}>
          <Tooltip title={name} arrow>
            <button
              className={`monster-button ${
                selectedType === mType ? "selected" : ""
              }`}
              onClick={() => selectMonster(mType)}
            >
              <img src={img} alt={name} className="monster-img" />
            </button>
          </Tooltip>
        </Grid>
      );
    }
    return buttons;
  };

  const renderMovementControls = (role: "game-master" | "hero") => {
    if (role === "hero")
      return (
        <div className="movement-controls">
          <button onClick={() => movePlayer(Direction.UP)}>⬆️ Haut</button>
          <button onClick={() => movePlayer(Direction.DOWN)}>⬇️ Bas</button>
          <button onClick={() => movePlayer(Direction.LEFT)}>⬅️ Gauche</button>
          <button onClick={() => movePlayer(Direction.RIGHT)}>➡️ Droite</button>
        </div>
      );
    if (role === "game-master")
      return (
        <div className="movement-controls">
          <button onClick={() => moveMonster(Direction.UP)}>⬆️ Haut</button>
          <button onClick={() => moveMonster(Direction.DOWN)}>⬇️ Bas</button>
          <button onClick={() => moveMonster(Direction.LEFT)}>⬅️ Gauche</button>
          <button onClick={() => moveMonster(Direction.RIGHT)}>
            ➡️ Droite
          </button>
        </div>
      );
  };

  function goInTargetMode(): void {
    setTargetMode(true);
  }

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
          {role === "hero" &&
            game.currentTurn === socket.id &&
            renderMovementControls(role)}
          <div className="dices-section">
            <RedDices
              socket={socket}
              gameId={gameId}
              role={"hero"}
              viewerRole={role}
            />
            <Dices
              socket={socket}
              gameId={gameId}
              role={"hero"}
              viewerRole={role}
            />
          </div>
          {role === "hero" && player?.stats?.equipments && (
            <div className="attack-choice">
              Arme selectionnée :
              <select className="weapons" id="weapons-select" onChange={(e)=> {setSelectedWeapon(e.target.value)}} value={selectedWeapon ?? ""}>
                {player?.stats?.equipments?.map((equipmentId) => {
                  return (
                    <option key={equipmentId} value={equipmentId}>
                      {getEquipmentName(equipmentId)}
                    </option>
                  );
                })}
              </select>
              <button onClick={() => goInTargetMode()}>Attaquer</button>
            </div>
          )}
          {message && <div className="game-message">{message}</div>}
          {game.currentTurn === socket.id && (
            <div>
              <button onClick={endTurn}>END TURN</button>
            </div>
          )}
        </Accordion>
      </div>
      <div className="game-controls game-master">
        {role === "game-master" && (
          <div>
            <Accordion sx={{ color: "white", background: "inherit" }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel2-content"
                id="panel2-header"
              >
                <Typography component="span">Actions Maître du Jeu</Typography>
              </AccordionSummary>
              <Grid container>
                {/* monster selector: generate buttons from the enum values */}
                {renderMonsterButtons()}
              </Grid>
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
                <button onClick={putWall}>Mur</button>
                <button onClick={putFurniture}>Meuble</button>
              </div>
              <div className="two-button-container">
                <button onClick={unSelect}>Annuler</button>
                <button onClick={erase}>Effacer</button>
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
                  <button onClick={putTopDoor}>Porte Haut</button>
                </Grid>
                <Grid size={6}>
                  <button onClick={putBottomDoor}>Porte Bas</button>
                </Grid>
                <Grid size={6}>
                  <button onClick={putLeftDoor}>Porte Gauche</button>
                </Grid>
                <Grid size={6}>
                  <button onClick={putRightDoor}>Porte Droite</button>
                </Grid>
              </Grid>
            </Accordion>
          </div>
        )}
        <Accordion sx={{ color: "white", background: "inherit" }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel4-content"
            id="panel4-header"
          >
            <Typography component="span">Lancers de Dés</Typography>
          </AccordionSummary>
          <div className="dices-section">
            <RedDices
              socket={socket}
              gameId={gameId}
              role={"game-master"}
              viewerRole={role}
            />
            <Dices
              socket={socket}
              gameId={gameId}
              role={"game-master"}
              viewerRole={role}
            />
          </div>
        </Accordion>
        {role === "game-master" &&
          selectedUnit !== null &&
          renderMovementControls(role)}
        {role === "game-master" && (
          <Accordion sx={{ color: "white", background: "inherit" }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel5-content"
              id="panel5-header"
            >
              <Typography component="span">Contrôles Maître du Jeu</Typography>
            </AccordionSummary>
            <div>
              <MasterControls socket={socket} gameId={gameId} />
            </div>
          </Accordion>
        )}
      </div>
    </div>
  );
};

export { GameControls };
