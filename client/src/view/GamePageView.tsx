import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Board from "../components/BoardComponent";
import "./GamePageView.css";
import {
  Direction,
  GameState,
  Monster,
  monsterClass,
  Player,
  Position,
  SendableGameState,
  tileType,
  Unit,
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
  const [selectedUnit, setSelectedUnit] = useState<Player | Monster | null>(
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
    selectedPosition && setSelectedUnit(getUnitAtSelectedPosition(selectedPosition, gameState));
  }, [selectedPosition, gameState]);

  useEffect(() => {
    if (!gameState) return;

    socket.on("game-state-update", (data: { gameState: SendableGameState }) => {
      console.log("c'est l'update du gamePage", gameState);

      const updatedGameState = convertSendableGameStateAsGameState(
        data.gameState
      );
      setCurrentGameState(updatedGameState);
      if (selectedPosition) {
        setSelectedUnit(
          getUnitAtSelectedPosition(selectedPosition, updatedGameState)
        );
      }
    });

    socket.on(
      "stats-updated",
      (data: { entityId: string; newStats: Unit; isPlayer: boolean }) => {
        console.log("stats updated received in game page", data);
        const position = currentGameState.entityPositions.get(data.entityId);
        if (!position) {
          console.error("No entity found at position for stats update");
          return;
        }
        if (data.isPlayer) {
          let player = currentGameState.players.get(data.entityId);
          if (player) {
            player.stats = data.newStats;
            currentGameState.players.set(data.entityId, player);
          }
        } else {
          let monster = currentGameState.monsters.get(data.entityId);
          if (monster) {
            monster.stats = data.newStats;
            currentGameState.monsters.set(data.entityId, monster);
          }
        }
        console.log(
          "game state after stat update : ",
          currentGameState.players
        );
      }
    );

    return () => {
      socket.off("stats-updated");
      socket.off("game-state-update");
    };
  }, [socket, gameState, currentGameState, selectedPosition]);

  const handleTileClick = (
    gameId: string,
    position: Position,
    monsterType: monsterClass | null
  ) => {
    if (
      selectedPosition !== null &&
      selectedPosition.x === position.x &&
      selectedPosition.y === position.y
    ) {
      setSelectedPosition(null);
      setSelectedUnit(null);
    } else {
      setSelectedPosition(position);
      setSelectedUnit(getUnitAtSelectedPosition(position, currentGameState));
    }
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

  return (
    <div className="game-page">
      {currentGameState && (
        <div className="game-container">
          <div
            className={
              statsVisible && selectedUnit !== null ? "HeroStats" : "hidden"
            }
          >
            {statsVisible && (
              <StatsComponent
                socket={socket}
                gameId={gameState.id}
                position={selectedPosition ?? { x: 0, y: 0 }}
                unit={selectedUnit}
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
                  selectedPosition={selectedPosition}
                  selectedType={selectedType}
                  monsterType={monsterType}
                />
              )}
              <div>
                {selectedUnit !== null && (
                  <button
                    onClick={() =>
                      selectedUnit !== null && setStatsVisible(!statsVisible)
                    }
                  >
                    {!statsVisible ? "Montrer stats" : "Cacher stats"}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="info-on-the-side">
            <GameControls
              socket={socket}
              setSelectedType={setSelectedType}
              monsterType={monsterType}
              setMonsterType={setMonsterType}
              selectedUnit={selectedUnit}
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
              {currentGameState.players && (
                <p>Joueurs: {currentGameState.players.size}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getUnitAtSelectedPosition = (pos: Position, game: GameState) => {
  if (!pos) return null;
  const id = game.positionEntities.get(pos.x + "," + pos.y);
  const unit = id
    ? game.players.get(id) || game.monsters.get(id) || null
    : null;
  console.log(" unit at selected position", unit);
  return unit;
};

export default GamePage;
