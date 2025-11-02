import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Board from "../components/BoardComponent";
import "./GamePageView.css";
import {
  GameState,
  monsterClass,
  Position,
  SendableGameState,
  tileType,
} from "../shared/type";
import { GameControls } from "../components/GameControlsComponent";
import { convertSendableGameStateAsGameState } from "../shared/utils";
import HeroStats from "../components/HeroStats";

interface GamePageProps {
  socket: any;
}

const GamePage: React.FC<GamePageProps> = ({ socket }) => {
  const location = useLocation();
  const gameState = location.state.gameState;
  const role = location.state.role;

  const [monsterType, setMonsterType] = useState<monsterClass | null>(null);

  const [selectedType, setSelectedType] = useState<tileType | null>(null);

  const [currentGameState, setCurrentGameState] =
    useState<GameState>(gameState);

  const player = gameState.players.get(socket.id);
  const [statsVisible, setStatsVisible] = useState(false);
  const [visibleStatsTotal, setVisibleStatsTotal] = useState(false);

  useEffect(() => {
    setVisibleStatsTotal(role === "hero" && player && statsVisible);
  }, [role, player, statsVisible]);

  useEffect(() => {
    if (!gameState) return;

    socket.on("game-state-update", (data: { gameState: SendableGameState }) => {
      console.log("c'est l'update du gamePage", gameState);

      setCurrentGameState(convertSendableGameStateAsGameState(data.gameState));
    });

    return () => {
      socket.off("game-state-update");
    };
  }, [socket, gameState, currentGameState]);

  const handleTileClick = (
    gameId: string,
    position: Position,
    monsterType: monsterClass | null
  ) => {
    if (selectedType === undefined) {
      //nothing to place
      return;
    }
    if (selectedType === tileType.monster && !monsterType) {
      console.error("monsterType must be defined when placing a monster");
      return;
    }
    socket.emit("place-element", {
      gameId,
      position,
      selectedType,
      playerId: socket.id,
      monsterType: monsterType,
    });
  };

  return (
    <div className="game-page">
      {currentGameState && (
        <div className="game-container">
          <div className={visibleStatsTotal ? "HeroStats" : "hidden"}>
            {visibleStatsTotal &&
              HeroStats({ socket, player, setStatsVisible })}
          </div>
          <div className="Board">
            <div>
              {socket !== null &&
                Board({
                  gameState: currentGameState,
                  socket: socket,
                  onTileClick: handleTileClick,
                  selectedType: selectedType,
                  monsterType: monsterType,
                })}
            </div>
            <div>
              {role === "hero" && (
                <button onClick={() => setStatsVisible(!statsVisible)}>
                  {!statsVisible ? "Montrer stats" : "Cacher stats"}
                </button>
              )}
            </div>
          </div>
          <div className="info-on-the-side">
            {GameControls({
              socket,
              setSelectedType,
              monsterType,
              setMonsterType,
            })}

            <div className="game-info">
              <h3>Informations</h3>
              {currentGameState.currentTurn === socket.id ? (
                <p>YOUR TURN !!!!!</p>
              ) : (
                <p>
                  Tour actuel:{" "}
                  {currentGameState.currentTurn &&
                    currentGameState.players &&
                    currentGameState.players.get(currentGameState.currentTurn)
                      ?.characterName}
                </p>
              )}
              {currentGameState.players ? (
                <p>Joueurs: {currentGameState.players.size}</p>
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
