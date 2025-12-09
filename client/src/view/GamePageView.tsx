import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Board from "../components/main_components/BoardComponent";
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
import {
  convertSendableGameStateAsGameState,
  getPlayerName,
} from "../shared/utils";
import { positionKey } from "../shared/utils";
import Footer from "../components/main_components/Footer";
import Navbar from "../components/main_components/Navbar";
import RightMenu from "../components/main_components/RightMenu";
import { Grid } from "@mui/material";
import LeftMenu from "../components/main_components/LeftMenu";
import SpellsPopUp from "../components/Card/Spells/SpellPopUp";

interface GamePageProps {
  socket: any;
}

const GamePage: React.FC<GamePageProps> = ({ socket }) => {
  const location = useLocation();
  const role = location.state.role;

  const [selectedType, setSelectedType] = useState<
    tileType | Direction | monsterClass | null
  >(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null
  );
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const [currentGameState, setCurrentGameState] = useState<GameState>(
    location.state.gameState
  );

  const [statsVisible, setStatsVisible] = useState(false);
  const [spellPageVisible, setSpellPageVisible] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState<string | null>(null);

  useEffect(() => {
    socket.on("game-state-update", (data: { gameState: SendableGameState }) => {
      const updatedGameState = convertSendableGameStateAsGameState(
        data.gameState
      );
      console.log("c'est l'update du gamePage", updatedGameState);
      const selectedId = selectedEntityId;
      if (selectedId) {
        const pos = updatedGameState.entityPositions.get(selectedId);
        if (pos) {
          setSelectedPosition(pos);
          setSelectedEntityId(selectedId);
        } else {
          setSelectedPosition(null);
          setSelectedEntityId(null);
        }
      } else if (selectedPosition) {
        const unit = getUnitAtSelectedPosition(
          selectedPosition,
          updatedGameState
        );
        if (unit) setSelectedEntityId(unit.id);
      }

      setCurrentGameState(updatedGameState);
    });

    socket.on(
      "stats-updated",
      (data: { entityId: string; newStats: Unit; isPlayer: boolean }) => {
        console.log("stats updated received in game page", data);
        setCurrentGameState((prev) => {
          if (!prev) return prev;
          const position = prev.entityPositions.get(data.entityId);
          if (!position) {
            console.error("No entity found at position for stats update");
            return prev;
          }

          const players = new Map(prev.players);
          const monsters = new Map(prev.monsters);

          if (data.isPlayer) {
            const player = players.get(data.entityId);
            if (player) {
              players.set(data.entityId, { ...player, stats: data.newStats });
            }
          } else {
            const monster = monsters.get(data.entityId);
            if (monster) {
              monsters.set(data.entityId, { ...monster, stats: data.newStats });
            }
          }

          return { ...prev, players, monsters } as GameState;
        });
      }
    );

    socket.on(
      "tile-placed",
      (data: { position: Position; tileType: tileType }) => {
        console.log("tile placed received in game page", data);
        setCurrentGameState((prev) => {
          if (!prev) return prev;

          const board = prev.board.map((row) => row.slice());
          board[data.position.x][data.position.y] = data.tileType;

          return { ...prev, board } as GameState;
        });
      }
    );

    return () => {
      socket.off("tile-placed");
      socket.off("stats-updated");
      socket.off("game-state-update");
    };
  }, [socket, selectedPosition, selectedEntityId]);

  const setSelectedUnit = (unit: Player | Monster | null) => {
    if (!unit) return;
    const position = currentGameState.entityPositions.get(unit.id);
    if (!position) return;
    setSelectedPosition(position);
    setSelectedEntityId(unit.id);
  };

  const handleTileClick = (
    gameId: string,
    position: Position,
    selectedType: tileType | Direction | monsterClass | null
  ) => {
    if (selectedSpell !== null) {
      console.log("Casting spell:", selectedSpell, "at position:", position);
      socket.emit(
        "cast-spell",
        {
          gameId,
          spellId: selectedSpell,
          position: position,
        },
        (response: { success: boolean; error?: string }) => {
          if (response.success) {
            console.log("Spell cast successfully");
            setSelectedSpell(null);
          } else {
            console.error("Failed to cast spell:", response.error);
          }
        }
      );
      return;
    }

    if (
      selectedPosition !== null &&
      selectedPosition.x === position.x &&
      selectedPosition.y === position.y
    ) {
      console.log("Deselecting position:", position);
      setSelectedPosition(null);
      setSelectedEntityId(null);
      setStatsVisible(false);
    } else {
      setSelectedPosition(position);
      // set selected entity id based on current game state mapping
      const idAtPos = currentGameState?.positionEntities.get(
        positionKey(position)
      );
      if (!idAtPos) {
        setStatsVisible(false);
      }
      setSelectedEntityId(idAtPos ?? null);
    }

    if (!selectedType) {
      console.log("No element selected to place.");
      return;
    }
    console.log("Placing element:", selectedType, "at position:", position);
    socket.emit("place-element", {
      gameId,
      position,
      selectedType,
      playerId: socket.id,
    });
  };

  //           <div className="game-info">
  //             <h3>Informations</h3>
  //             {currentGameState.currentTurn === socket.id ? (
  //               <p>YOUR TURN !!!!!</p>
  //             ) : (
  //               <p>
  //                 Tour actuel:{" "}
  //                 {currentGameState.currentTurn &&
  //                   currentGameState.players &&
  //                   currentGameState.players.get(currentGameState.currentTurn)
  //                     ?.stats?.name}
  //               </p>
  //             )}
  //             {currentGameState.players && (
  //               <p>Joueurs: {currentGameState.players.size}</p>
  //             )}
  //           </div>
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );

  return (
    <>
      {spellPageVisible && (
        <SpellsPopUp
          socket={socket}
          spellSchools={currentGameState.players.get(socket.id)?.stats?.spells}
          spellAlreadyUsed={
            currentGameState.players.get(socket.id)?.stats?.usedSpells
          }
          onSpellClick={(selectedSpell: string) => {
            setSelectedSpell(selectedSpell);
          }}
          closeSpellPage={() => setSpellPageVisible(false)}
        />
      )}
      <Grid className="game-page" container>
        <Grid className="Navbar">
          <Navbar
            socket={socket}
            gameId={currentGameState.id}
            isCurrentTurnPlayer={
              currentGameState.currentTurn ===
              currentGameState.players.get(socket.id)?.id
            }
            currentTurnPlayerName={getPlayerName(
              currentGameState,
              currentGameState.currentTurn
            )}
            player={currentGameState.players.get(socket.id)}
            statsOpen={statsVisible}
            setStatsOpen={setStatsVisible}
            setSelectedUnit={setSelectedUnit}
            openSpellPage={() => setSpellPageVisible(true)}
          />
        </Grid>
        <Grid className="LeftMenu">
          <LeftMenu
            statsVisible={statsVisible}
            socket={socket}
            currentGameState={currentGameState}
            selectedPosition={selectedPosition}
            selectedUnit={getUnitAtSelectedPosition(
              selectedPosition!,
              currentGameState
            )}
            setStatsVisible={setStatsVisible}
            role={role}
          />
        </Grid>

        <Grid className={"Board" + (selectedSpell ? " target" : "")}>
          <Board
            gameState={currentGameState}
            socket={socket}
            onTileClick={handleTileClick}
            selectedPosition={selectedPosition}
            selectedEntityId={selectedEntityId}
            selectedType={selectedType}
          />
        </Grid>
        <Grid className="RightMenu">
          <RightMenu
            socket={socket}
            currentGameState={currentGameState}
            setSelectedType={setSelectedType}
            selectedType={selectedType}
            selectedUnit={getUnitAtSelectedPosition(
              selectedPosition!,
              currentGameState
            )}
          />
        </Grid>
        <Grid className="Footer">
          <Footer />
        </Grid>
      </Grid>
    </>
  );
};

const getUnitAtSelectedPosition = (
  pos: Position,
  game: GameState
): Monster | Player | null => {
  if (!pos) return null;
  const id = game.positionEntities.get(pos.x + "," + pos.y);
  if (!id) return null;
  const unit = game.players.get(id) || game.monsters.get(id);
  if (!unit) return null;
  return unit;
};

export default GamePage;
