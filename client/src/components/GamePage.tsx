import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Board from "./BoardComponent";
import "./GamePage.css";
import { GameState } from "../shared/type";
import { getPlayerNameToTurn } from "../shared/util";

interface GamePageProps {
  socket: any;
}

const GamePage: React.FC<GamePageProps> = ({ socket }) => {
  const location = useLocation();
  const { gameState } = location.state.gameState;
  const gameId = location.state.gameId;
  const role = location.state.role;
  const playerName = location.state.playerName;
  console.log("gameState : ", gameState);
  console.log("socket : ", socket);

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
  console.log(currentGameState);
  if (!currentGameState) {
    return <div>Chargement du jeu...</div>;
  }

  return (
    <div className="game-page">
      <header className="game-header">
        <h1>🎮 Partie en cours - {gameId}</h1>
        <p>
          Joueur: {playerName} | Rôle: {role}
        </p>
      </header>

      <div className="game-container">
        <div className="game-board">
          {/* Ici vous mettrez votre composant de plateau */}
          <div className="board-placeholder">
            🏰 Plateau de jeu en construction...
          </div>
        </div>

        <div className="Board">
          {Board({ gameState: currentGameState, socket: socket })}
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
