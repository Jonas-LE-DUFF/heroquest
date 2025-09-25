import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Board from "./BoardComponent";
import "./GamePage.css";
import { GameState, Position, tileType } from "../shared/type";
import { getPlayerNameToTurn, getPlayerRole } from "../shared/util";
import { useSocketContext } from "../contexts/SocketContext";

interface GamePageProps {
  socket: any;
}

const GamePage: React.FC = () => {
  const location = useLocation();
  const { gameState } = location.state.gameState;
  const gameId = location.state.gameId;
  const role = location.state.role;
  const playerName = location.state.playerName;

  const [selectedType, setSelectedType] = useState<tileType | null>(null);

  const [currentGameState, setCurrentGameState] =
    useState<GameState>(gameState);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!gameState) return;

    // Écouter les mises à jour du jeu
    socket.on("game-state-update", (data: { gameState: GameState }) => {
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
    if (role === "game-master") {
      socket.emit("spawn-monster", {
        gameId,
        monsterType: "goblin",
        position: { x: 5, y: 5 },
      });
    }
  };
  if (!currentGameState) {
    return <div>Chargement du jeu...</div>;
  }

  const putWall = () => {
    console.log("mur");
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

  const handleTileClick = (gameState: GameState, position: Position) => {
    console.log("Tile clicked in GamePage:", position, selectedType);
    if (getPlayerRole(gameState, socket?.id) !== "game-master") {
      console.log("seul le maitre du jeu peut placer des objets");
      return;
    }
    let tile = gameState.board[position.x][position.y];

    if (tile.type !== tileType.empty) {
      console.log("case non vide rien à placé...");
      return;
    }
    if (selectedType !== null) tile.type = selectedType;
    setSelectedType(null);
  };

  return (
    <div className="game-page">
      <header className="game-header">
        <h1>🎮 Partie en cours - {gameId}</h1>
        <p>
          Joueur: {playerName} | Rôle: {role}
        </p>
      </header>

      <div className="game-container">
        <div className="Board">
          {socket !== null &&
            Board({
              gameState: currentGameState,
              socket: socket,
              onTileClick: handleTileClick,
            })}
        </div>

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
            <div className="master-controls">
              <button onClick={spawnMonster}>
                👹 Faire apparaître un Gobelin
              </button>
              <button onClick={putWall}>Faire apparaître un mur</button>
              <button onClick={putHero}>placer un héro</button>
              <button onClick={putFurniture}>placer un trésor</button>
              <button onClick={unSelect}>Annuler</button>
            </div>
          )}

          {message && <div className="game-message">{message}</div>}
        </div>

        <div className="game-info">
          <h3>Informations</h3>
          {currentGameState.currentTurn === socket.id ? (
            <p>YOUR TURN !!!!!</p>
          ) : (
            <p>Tour actuel: {getPlayerNameToTurn(currentGameState)}</p>
          )}
          {currentGameState.players ? (
            <p>Joueurs: {currentGameState.players.length}</p>
          ) : (
            <p></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePage;
