import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { GameState, tileType } from "../shared/type";
import Dices from "./DicesComponent";
import "./GameControlsComponent.css";
import { Grid } from "@mui/material";

interface GameControlsProps {
  socket: any;
  setSelectedType: (type: tileType | null) => void;
}

const GameControls = ({ socket, setSelectedType }: GameControlsProps) => {
  const location = useLocation();
  const gameState = location.state.gameState;
  const gameId = location.state.gameId;
  const role = location.state.role;

  const [currentGameState, setCurrentGameState] =
    useState<GameState>(gameState);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!gameState) return;

    // Écouter les mises à jour du jeu
    socket.on("game-state-update", (data: { gameState: GameState }) => {
      console.log("c'est l'update du gamePage", gameState);

      setCurrentGameState(data.gameState);
    });

    socket.on("player-moved", (data: any) => {
      setMessage(`${data.playerName} s'est déplacé`);
    });

    socket.on("monster-spawned", (data: any) => {
      setMessage(`Un ${data.monsterType} est apparu !`);
    });

    return () => {
      socket.off("game-state-update");
      socket.off("player-moved");
      socket.off("monster-spawned");
    };
  }, [socket, gameState, currentGameState]);

  const movePlayer = (direction: string) => {
    socket.emit("move-player", {
      gameId,
      direction,
      playerId: socket.id,
    });
  };

  const spawnMonster = () => {
    setSelectedType(tileType.monster);
  };

  const putWall = () => {
    setSelectedType(tileType.wall);
  };

  const putHero = () => {
    setSelectedType(tileType.hero);
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

  return (
    <div className="game-controls">
      <h3>Actions</h3>
      {role === "hero" && (
        <div className="movement-controls">
          <button onClick={() => movePlayer("up")}>⬆️ Haut</button>
          <button onClick={() => movePlayer("down")}>⬇️ Bas</button>
          <button onClick={() => movePlayer("left")}>⬅️ Gauche</button>
          <button onClick={() => movePlayer("right")}>➡️ Droite</button>
        </div>
      )}

      {role === "game-master" && (
        <div>
          <Grid
            container
            className="master-controls"
            sx={{
              width: "100%",
              justifyContent: "space-evenly",
              padding: "10px",
            }}
          >
            <Grid className="gridElem" size={3}>
              <button onClick={spawnMonster}>Monstre</button>
            </Grid>
            <Grid className="gridElem" size={3}>
              <button onClick={putHero}>Héro</button>
            </Grid>
            <Grid className="gridElem" size={3}>
              <button onClick={putWall}>Mur</button>
            </Grid>
            <Grid className="gridElem" size={3}>
              <button onClick={putFurniture}>Meuble</button>
            </Grid>
          </Grid>
          <div className="two-button-container">
            <button onClick={unSelect}>Annuler</button>
            <button onClick={erase}>Effacer</button>
          </div>
          {Dices({ socket, gameId })}
        </div>
      )}

      {message && <div className="game-message">{message}</div>}
    </div>
  );
};

export { GameControls };
