import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Board from "../components/BoardComponent";
import "./GamePageView.css";
import { GameState, Position, tileType } from "../shared/type";
import { getPlayerNameToTurn } from "../shared/util";
import { GameControls } from "../components/GameControlsComponent";

interface GamePageProps {
  socket: any;
}

const GamePage: React.FC<GamePageProps> = ({ socket }) => {
  const location = useLocation();
  const gameState = location.state.gameState;
  const gameId = location.state.gameId;
  const role = location.state.role;
  const playerName = location.state.playerName;

  const [selectedType, setSelectedType] = useState<tileType | null>(null);

  const [currentGameState, setCurrentGameState] =
    useState<GameState>(gameState);
  useEffect(() => {
    if (!gameState) return;

    // Écouter les mises à jour du jeu
    socket.on("game-state-update", (data: { gameState: GameState }) => {
      console.log("c'est l'update du gamePage", gameState);

      setCurrentGameState(data.gameState);
    });

    return () => {
      socket.off("game-state-update");
    };
  }, [socket, gameState, currentGameState]);

  const handleTileClick = (gameId: string, position: Position) => {
    if (selectedType === undefined) {
      //nothing to place
      return;
    }
    socket.emit("place-element", {
      gameId,
      position,
      selectedType,
      playerId: socket.id,
    });
  };

  return (
    <div className="game-page">
      <header className="game-header">
        <h1>🎮 Partie en cours - {gameId}</h1>
        <p>
          Joueur: {playerName} | Rôle: {role}
        </p>
      </header>

      {currentGameState && (
        <div className="game-container">
          <div className="Board">
            {socket !== null &&
              Board({
                gameState: currentGameState,
                socket: socket,
                onTileClick: handleTileClick,
                selectedType: selectedType,
              })}
          </div>
          <div className="info-on-the-side">
            {GameControls({ socket, setSelectedType })}

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
      )}
    </div>
  );
};

export default GamePage;
