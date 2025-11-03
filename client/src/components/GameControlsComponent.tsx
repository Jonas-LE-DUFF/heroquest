import React, { useState, useEffect, JSX } from "react";
import { useLocation } from "react-router-dom";
import {
  Direction,
  GameState,
  monsterClass,
  SendableGameState,
  tileType,
} from "../shared/type";
import Dices from "./dices/HeroQuestDicesComponent";
import "./GameControlsComponent.css";
import { Grid, Tooltip } from "@mui/material";
import {
  convertSendableGameStateAsGameState,
  getMonsterIconPath,
} from "../shared/utils";
import RedDices from "./dices/RedDicesComponent";
import { monsterClassFr } from "../shared/frenchEnums";
import MasterControls from "./MasterControlsComponent";

interface GameControlsProps {
  socket: any;
  setSelectedType: (type: tileType | null) => void;
  monsterType: monsterClass | null;
  setMonsterType: (type: monsterClass | null) => void;
}

const GameControls = ({
  socket,
  setSelectedType,
  monsterType,
  setMonsterType,
}: GameControlsProps) => {
  const location = useLocation();
  const gameId = location.state.gameId;
  const role = location.state.role;

  const [game, setgame] = useState<GameState>(location.state.gameState);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!game) return;

    // Écouter les mises à jour du jeu
    socket.on("game-state-update", (data: { gameState: SendableGameState }) => {
      console.log("c'est l'update du gamePage", game);

      setgame(convertSendableGameStateAsGameState(data.gameState));
    });

    socket.on("player-moved", (data: any) => {
      setMessage(`${data.playerName} s'est déplacé`);
    });

    return () => {
      socket.off("game-state-update");
      socket.off("player-moved");
    };
  }, [socket, game]);

  const movePlayer = (direction: Direction) => {
    console.log("movement");

    socket.emit("move-player-one-step", {
      gameId,
      playerId: socket.id,
      direction: direction,
    });
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

  return (
    <div>
      <div className="game-controls hero">
        <h3>Actions</h3>
        {role === "hero" && game.currentTurn === socket.id && (
          <div className="movement-controls">
            <button onClick={() => movePlayer(Direction.UP)}>⬆️ Haut</button>
            <button onClick={() => movePlayer(Direction.DOWN)}>⬇️ Bas</button>
            <button onClick={() => movePlayer(Direction.LEFT)}>
              ⬅️ Gauche
            </button>
            <button onClick={() => movePlayer(Direction.RIGHT)}>
              ➡️ Droite
            </button>
          </div>
        )}

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
        <hr />
        {role === "game-master" && (
          <MasterControls socket={socket} gameId={gameId} />
        )}
      </div>
    </div>
  );
};

export { GameControls };
