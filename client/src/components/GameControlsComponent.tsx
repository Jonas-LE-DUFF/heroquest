import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Direction,
  GameState,
  monsterClass,
  SendableGameState,
  tileType,
} from "../shared/type";
import Dices from "./HeroQuestDicesComponent";
import "./GameControlsComponent.css";
import { Grid } from "@mui/material";
import gobelinPicture from "./images/goblin.png";
import skeletonPicture from "./images/skeleton.png";
import zombiePicture from "./images/zombie.png";
import orcPicture from "./images/orc.png";
import abominationPicture from "./images/abomination.png";
import mummyPicture from "./images/mummy.png";
import dreadWarriorPicture from "./images/dreadwarrior.png";
import gargoylePicture from "./images/gargoyle.png";
import { convertSendableGameStateAsGameState } from "../shared/utils";
import RedDices from "./RedDicesComponent";

interface GameControlsProps {
  socket: any;
  setSelectedType: (type: tileType | null) => void;
  monsterType: monsterClass | null;
  setMonsterType: (type: monsterClass | null) => void;
}

const GameControls = ({ socket, setSelectedType, monsterType, setMonsterType }: GameControlsProps) => {
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

  const putHero = () => {
    setSelectedType(tileType.hero);
    setMonsterType(null);
  };

  const putFurniture = () => {
    setSelectedType(tileType.furniture);
    setMonsterType(null);
  };

  const unSelect = () => {
    setSelectedType(null);
    setMonsterType(null)
  };

  const erase = () => {
    setSelectedType(tileType.empty);
    setMonsterType(null);
  };

  const endTurn = () => {
    socket.emit("end-turn", { gameId: gameId });
  };

  return (
    <div className="game-controls">
      <h3>Actions</h3>
      {role === "hero" && game.currentTurn === socket.id && (
        <div className="movement-controls">
          <button onClick={() => movePlayer(Direction.UP)}>⬆️ Haut</button>
          <button onClick={() => movePlayer(Direction.DOWN)}>⬇️ Bas</button>
          <button onClick={() => movePlayer(Direction.LEFT)}>⬅️ Gauche</button>
          <button onClick={() => movePlayer(Direction.RIGHT)}>➡️ Droite</button>
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
            <Grid container spacing={1} sx={{ margin: "10px 0" }}>
              {[ //TODO : optimize this with the enum and getmonsterIcon
                {
                  type: monsterClass.Goblin,
                  img: gobelinPicture,
                  name: "Gobelin",
                },
                {
                  type: monsterClass.Squelette,
                  img: skeletonPicture,
                  name: "Squelette",
                },
                {
                  type: monsterClass.Zombie,
                  img: zombiePicture,
                  name: "Zombie",
                },
                { type: monsterClass.Orc, img: orcPicture, name: "Orc" },
                {
                  type: monsterClass.Abomination,
                  img: abominationPicture,
                  name: "Abomination",
                },
                {
                  type: monsterClass.Momie,
                  img: mummyPicture,
                  name: "Momie",
                },
                {
                  type: monsterClass.Guerrier_de_la_terreur,
                  img: dreadWarriorPicture,
                  name: "Guerrier terreur",
                },
                {
                  type: monsterClass.Gargouille,
                  img: gargoylePicture,
                  name: "Gargouille",
                },
              ].map((monster) => (
                <Grid key={monster.type} size={4}>
                  <button
                    className={`monster-button ${
                      monsterType === monster.type ? "selected" : ""
                    }`}
                    onClick={() => selectMonster(monster.type)}
                  >
                    <img src={monster.img} alt={monster.name} />
                    <span>{monster.name}</span>
                  </button>
                </Grid>
              ))}
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
        </div>
      )}
      {RedDices({
        socket,
        gameId,
        throwable: game.currentTurn === socket.id && role === "hero",
      })}
      {Dices({ socket, gameId })}
      {message && <div className="game-message">{message}</div>}

      {game.currentTurn === socket.id && (
        <div>
          <button onClick={endTurn}>END TURN</button>
        </div>
      )}
    </div>
  );
};

export { GameControls };
