import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Board from "../components/BoardComponent";
import "./GamePageView.css";
import {
  Direction,
  GameState,
  monsterClass,
  Position,
  SendableGameState,
  tileType,
} from "../shared/type";
import { GameControls } from "../components/GameControlsComponent";
import { convertSendableGameStateAsGameState } from "../shared/utils";
import StatsComponent from "../components/StatsComponent";

interface GamePageProps {
  socket: any;
}

const GamePage: React.FC<GamePageProps> = ({ socket }) => {
  const location = useLocation();
  const gameState = location.state.gameState;
  const role = location.state.role;

  const [monsterType, setMonsterType] = useState<monsterClass | null>(null);

  const [selectedType, setSelectedType] = useState<tileType | Direction | null>(
    null
  );
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null
  );

  const [currentGameState, setCurrentGameState] =
    useState<GameState>(gameState);

  const [statsVisible, setStatsVisible] = useState(false);

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
    setSelectedPosition(position);
    console.log(position);

    if (!selectedType) {
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

  const getUnitAtSelectedPosition = () => {
    if (!selectedPosition) {
      return null;
    }
    const id = currentGameState.positionEntities.get(
      selectedPosition.x + "," + selectedPosition.y
    );
    const unit =  id
      ? currentGameState.players.get(id) ||
          currentGameState.monsters.get(id) ||
          null
      : null;
      console.log(" unit at selected position", unit);
      return unit;
  };

  return (
    <div className="game-page">
      {currentGameState && (
        <div className="game-container">
          <div
            className={
              statsVisible && getUnitAtSelectedPosition() !== null
                ? "HeroStats"
                : "hidden"
            }
          >
            {statsVisible && (
              <StatsComponent
                socket={socket}
                unit={getUnitAtSelectedPosition()}
                setStatsVisible={setStatsVisible}
                isGameMaster={role === "game-master"}
              />
            )}
          </div>
          <div className="Board">
            <div>
              {socket !== null && (
                <Board
                  gameState={currentGameState}
                  socket={socket}
                  onTileClick={handleTileClick}
                  selectedType={selectedType}
                  monsterType={monsterType}
                />
              )}
            </div>
            <div>
              {
                <button onClick={() => getUnitAtSelectedPosition() !== null && setStatsVisible(!statsVisible)}>
                  {!statsVisible ? "Montrer stats" : "Cacher stats"}
                </button>
              }
            </div>
          </div>
          <div className="info-on-the-side">
            <GameControls
              socket={socket}
              setSelectedType={setSelectedType}
              monsterType={monsterType}
              setMonsterType={setMonsterType}
            />

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
                      ?.stats?.name}
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
