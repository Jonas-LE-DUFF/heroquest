import React, { useState, useEffect, JSX } from "react";
import { useLocation } from "react-router-dom";
import {
  Direction,
  GameState,
  Monster,
  monsterClass,
  Player,
  Position,
  tileType,
} from "../shared/type";
import Dices from "./dices/HeroQuestDicesComponent";
import "./GameControlsComponent.css";
import { Grid, Tooltip } from "@mui/material";
import {
  getMonsterIconPath
} from "../shared/utils";
import RedDices from "./dices/RedDicesComponent";
import { monsterClassFr } from "../shared/frenchEnums";
import MasterControls from "./MasterControlsComponent";

interface GameControlsProps {
  socket: any;
  game: GameState;
  setSelectedType: (type: tileType | Direction | null) => void; //Direction -> door placement
  monsterType: monsterClass | null;
  setMonsterType: (type: monsterClass | null) => void;
  selectedUnit: Player | Monster | null;
  setSelectedUnit: (unit: Player | Monster | null) => void;
  setSelectedPosition: (pos: Position | null) => void;
}

const GameControls = ({
  socket,
  game,
  setSelectedType,
  monsterType,
  setMonsterType,
  selectedUnit,
  setSelectedPosition,
  setSelectedUnit,
}: GameControlsProps) => {
  const location = useLocation();
  const gameId = location.state.gameId;
  const role = location.state.role;

  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!game) return;

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
    setSelectedType(tileType.monster);
    setMonsterType(monster);
  };

  const putWall = () => {
    setSelectedType(tileType.wall);
    setMonsterType(null);
  };

  const putFurniture = () => {
    setSelectedType(tileType.furniture);
    setMonsterType(null);
  };

  const unSelect = () => {
    setSelectedType(null);
    setMonsterType(null);
  };

  const erase = () => {
    setSelectedType(tileType.empty);
    setMonsterType(null);
  };

  const putTopDoor = () => {
    setSelectedType(Direction.UP);
    setMonsterType(null);
  };

  const putBottomDoor = () => {
    setSelectedType(Direction.DOWN);
    setMonsterType(null);
  };

  const putLeftDoor = () => {
    setSelectedType(Direction.LEFT);
    setMonsterType(null);
  };

  const putRightDoor = () => {
    setSelectedType(Direction.RIGHT);
    setMonsterType(null);
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
                monsterType === mType ? "selected" : ""
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

  return (
    <div>
      <div className="game-controls hero">
        <h3>Actions</h3>
        {role === "hero" &&
          game.currentTurn === socket.id &&
          renderMovementControls(role)}

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
        {message && <div className="game-message">{message}</div>}
        {game.currentTurn === socket.id && (
          <div>
            <button onClick={endTurn}>END TURN</button>
          </div>
        )}
      </div>
      <div className="game-controls game-master">
        {role === "game-master" && (
          <div>
            <Grid container sx={{ width: "fit-content" }}>
              {/* monster selector: generate buttons from the enum values */}
              <Grid container spacing={1} sx={{ margin: "10px 0" }}>
                {renderMonsterButtons()}
              </Grid>
              <Grid className="gridElem" size={4}>
                <button onClick={putWall}>Mur</button>
              </Grid>
              <Grid className="gridElem" size={4}>
                <button onClick={putFurniture}>Meuble</button>
              </Grid>
            </Grid>
            <div className="two-button-container">
              <button onClick={unSelect}>Annuler</button>
              <button onClick={erase}>Effacer</button>
            </div>
            <Grid container>
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
          </div>
        )}
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
        {role === "game-master" &&
          selectedUnit !== null &&
          renderMovementControls(role)}
        <hr />
        {role === "game-master" && (
          <MasterControls socket={socket} gameId={gameId} />
        )}
      </div>
    </div>
  );
};

export { GameControls };
