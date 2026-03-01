import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import Board from "../components/main_components/BoardComponent";
import "./GamePageView.css";
import { isHero } from "../shared/utils";
import Footer from "../components/main_components/Footer";
import Navbar from "../components/main_components/Navbar";
import RightMenu from "../components/main_components/RightMenu";
import { Grid } from "@mui/material";
import LeftMenu from "../components/main_components/LeftMenu";
import SpellsPopUp from "../components/Card/Spells/SpellPopUp";
import { MonsterCategory } from "../POO/enums/Categories/MonsterCategory";
import { PositionAsJson } from "../POO/interfaces/ClassAsJson/PositionAsJson";
import { GameAsJson } from "../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { GameStateAsJson } from "../POO/interfaces/ClassAsJson/Server/GameStateAsJson";
import { StatsAsJson } from "../POO/interfaces/ClassAsJson/Unit/StatsAsJson";
import {
  getPositionByUnitId,
  getTileByPosition,
  getTileByUnitId,
  removeUnitFromBoardById,
  setTileTypeAtPosition,
} from "../shared/boardUtils";
import { HeroAsJson } from "../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import {
  getHeroByPlayerId,
  getPlayerByHero,
  getPlayerBySocketId,
  getPlayerIdToPlay,
} from "../shared/serverUtils";
import { TileType } from "../POO/enums/TileType";
import { setDoorAtPosition } from "../shared/doorUtils";
import { MonsterAsJson } from "../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { BoardAsJson } from "../POO/interfaces/ClassAsJson/Board/BoardAsJson";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { Direction } from "../POO/enums/Direction";

interface GamePageProps {
  socket: any;
}

const GamePage: React.FC<GamePageProps> = ({ socket }) => {
  const location = useLocation();
  const role = location.state.role;

  const [selectedType, setSelectedType] = useState<
    TileType | Direction | MonsterCategory | null
  >(null);
  const [selectedPosition, setSelectedPosition] =
    useState<PositionAsJson | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const [currentGame, setCurrentGame] = useState<GameAsJson>(
    location.state.game,
  );
  const [boardKey, setBoardKey] = useState(0); // Force re-render key
  const user = currentGame.players.find((p) => p.id === socket.id);
  const hero = getHeroByPlayerId(socket.id, currentGame);
  if ((!hero || !isHero(hero)) && role !== PlayerRole.GAME_MASTER) {
    throw new Error("Hero not found for current player in game state");
  }
  const [statsVisible, setStatsVisible] = useState(false);
  const [spellPageVisible, setSpellPageVisible] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState<string | null>(null);
  const weapons = hero?.equipment.weapons.map((w) => w.id) ?? [];

  const [selectedWeapon, setSelectedWeapon] = useState<string | null>(
    weapons[hero?.equipment.selectedWeaponIndex ?? 0] ?? null,
  );

  const [targetMode, setTargetMode] = useState<boolean>(false);

  // Handle stats update separately to ensure proper re-render
  const handleStatsUpdate = useCallback(
    (data: { entityId: string; newStats: StatsAsJson }) => {
      console.log("stats updated received in game page", data);

      const isDead =
        data.newStats.health !== undefined && data.newStats.health <= 0;

      setCurrentGame((prev) => {
        if (!prev) return prev;
        const unit = prev.gameState.Units.find((u) => u.id === data.entityId);
        const tileOfUnit = getTileByUnitId(data.entityId, prev.gameState.board);
        if (!unit || !tileOfUnit || !tileOfUnit.unit) return prev;
        tileOfUnit.unit.stats = data.newStats;
        unit.stats = data.newStats;

        if (isHero(unit)) {
          const player = getPlayerByHero(unit as HeroAsJson, prev.players);
          if (!player) {
            console.error("Player not found for hero with id:", data.entityId);
            return prev;
          }
          if (isDead) {
            console.log(`Player ${data.entityId} has been defeated.`);
            prev.players = prev.players.filter((p) => p.id !== player.id);
          }
        }

        if (isDead) {
          prev.gameState.Units = prev.gameState.Units.filter(
            (u) => u.id !== data.entityId,
          );
          removeUnitFromBoardById(data.entityId, prev.gameState.board);
        } else {
          unit.stats = data.newStats;
          tileOfUnit.unit.stats = data.newStats;
        }

        return { ...prev } as GameAsJson;
      });

      // TODO : try to remove this setTimeout
      // Force board re-render OUTSIDE the setCurrentGameState callback
      if (isDead) {
        setTimeout(() => {
          setBoardKey((k) => k + 1);
        }, 0);
      }
    },
    [],
  );

  useEffect(() => {
    socket.on("game-state-update", (data: { game: GameAsJson }) => {
      console.log("c'est l'update du gamePage", data.game);
      const selectedId = selectedEntityId;
      if (selectedId) {
        const pos = getPositionByUnitId(selectedId, data.game.gameState.board);
        if (pos) {
          setSelectedPosition(pos);
          setSelectedEntityId(selectedId);
        } else {
          setSelectedPosition(null);
          setSelectedEntityId(null);
        }
      } else if (selectedPosition) {
        const unit = getTileByPosition(
          selectedPosition,
          data.game.gameState.board,
        )?.unit;
        if (unit) setSelectedEntityId(unit.id);
      }

      setCurrentGame(data.game);
      // Also increment board key on full game state updates
      // TODO : try to remove this setTimeout
      setBoardKey((k) => k + 1);
    });

    socket.on("stats-updated", handleStatsUpdate);

    socket.on(
      "tile-placed",
      (data: { position: PositionAsJson; TileType: TileType }) => {
        console.log("tile placed received in game page", data);
        setCurrentGame((prev) => {
          if (!prev) return prev;

          setTileTypeAtPosition(
            data.position,
            data.TileType,
            prev.gameState.board,
          );

          return { ...prev } as GameAsJson;
        });

        // TODO : try to remove this setTimeout
        setBoardKey((k) => k + 1);
      },
    );

    socket.on(
      "door-placed",
      (data: {
        position: PositionAsJson;
        verticalOrHorizontal: "vertical" | "horizontal";
      }) => {
        console.log("door placed received in game page", data);
        setCurrentGame((prev) => {
          if (!prev) return prev;
          currentGame.gameState.board = setDoorAtPosition(
            data.position,
            data.verticalOrHorizontal,
            prev.gameState.board,
          );

          return { ...prev } as GameAsJson;
        });

        //TODO : try to remove this setTimeout
        setBoardKey((k) => k + 1);
      },
    );

    return () => {
      socket.off("tile-placed");
      socket.off("door-placed");
      socket.off("stats-updated");
      socket.off("game-state-update");
    };
  }, [socket, selectedPosition, selectedEntityId, handleStatsUpdate]);

  const setSelectedUnit = (unit: HeroAsJson | MonsterAsJson | null) => {
    if (!unit) return;
    const position = getPositionByUnitId(unit.id, currentGame.gameState.board);
    if (!position) return;
    setSelectedPosition(position);
    setSelectedEntityId(unit.id);
  };
  const getSelectedUnit = (
    position: PositionAsJson | null,
    board: BoardAsJson,
  ): HeroAsJson | MonsterAsJson | null => {
    if (!position) return null;
    const tile = getTileByPosition(position, board);
    if (!tile || !tile.unit) return null;
    return tile.unit as HeroAsJson | MonsterAsJson;
  };

  const handleTileClick = (
    gameId: string,
    position: PositionAsJson,
    selectedType: TileType | Direction | MonsterCategory | null,
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
          } else {
            console.error("Failed to cast spell:", response.error);
            alert("Failed to cast spell: " + response.error);
          }
        },
      );
      setTargetMode(false);
      setSelectedSpell(null);
      return;
    }

    if (targetMode) {
      console.log("In target mode, clicking on position:", position);

      const target = getTileByPosition(
        position,
        currentGame.gameState.board,
      )?.unit;
      if (!target) {
        console.log("No unit at selected position to target.");
        setTargetMode(false);
        return;
      }

      socket.emit(
        "attack",
        {
          gameId,
          attackerId: socket.id,
          targetId: target.id,
          weaponId: selectedWeapon,
        },
        (response: { success: boolean; error?: string }) => {
          if (response.success) {
            console.log("Attack executed successfully");
          } else {
            console.error("Failed to execute attack:", response.error);
          }
        },
      );
      setTargetMode(false);
      return;
    }
    console.log(
      "Tile clicked at position:",
      position,
      "with selectedType:",
      selectedType,
    );
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
      const idAtPos = getTileByPosition(position, currentGame.gameState.board)
        ?.unit?.id;
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
    socket.emit(
      "place-element",
      {
        gameId,
        position,
        selectedType,
        playerId: socket.id,
      },
      (response: { success: boolean; error?: string }) => {
        if (response.success) {
          console.log("Element placed successfully");
        } else {
          console.error("Failed to place element:", response.error);
        }
      },
    );
  };

  return (
    <>
      {spellPageVisible && (
        <SpellsPopUp
          socket={socket}
          spellSchools={hero?.spellElements}
          spellAlreadyUsed={hero?.usedSpells.map((spell) => spell.id) ?? []}
          onSpellClick={(selectedSpell: string) => {
            setSelectedSpell(selectedSpell);
            setTargetMode(true);
          }}
          closeSpellPage={() => setSpellPageVisible(false)}
        />
      )}
      <Grid className="game-page" container>
        <Grid className="Navbar">
          <Navbar
            socket={socket}
            game={currentGame}
            isCurrentTurnPlayer={
              getPlayerIdToPlay(currentGame) === socket.id || false
            }
            currentTurnPlayerName={
              getPlayerBySocketId(
                getPlayerIdToPlay(currentGame) || "Unknown",
                currentGame,
              )?.name || "Unknown"
            }
            player={user}
            statsOpen={statsVisible}
            selectedUnit={
              getSelectedUnit(selectedPosition, currentGame.gameState.board) ||
              null
            }
            setStatsOpen={setStatsVisible}
            setSelectedUnit={setSelectedUnit}
            openSpellPage={() => setSpellPageVisible(true)}
          />
        </Grid>
        <Grid className="LeftMenu">
          <LeftMenu
            statsVisible={statsVisible}
            socket={socket}
            currentGameState={currentGame}
            selectedPosition={selectedPosition}
            selectedUnit={
              getSelectedUnit(selectedPosition, currentGame.gameState.board) ||
              null
            }
            setStatsVisible={setStatsVisible}
            role={role}
          />
        </Grid>

        <Grid className={"Board" + (targetMode ? " target" : "")}>
          <Board
            key={`board-${boardKey}`}
            socket={socket}
            game={currentGame}
            onTileClick={handleTileClick}
            selectedPosition={selectedPosition}
            selectedEntityId={selectedEntityId}
            selectedType={selectedType}
          />
        </Grid>
        <Grid className="RightMenu">
          <RightMenu
            socket={socket}
            currentGameState={currentGame}
            setSelectedType={setSelectedType}
            selectedType={selectedType}
            selectedUnit={
              getSelectedUnit(selectedPosition, currentGame.gameState.board) ||
              null
            }
            setTargetMode={setTargetMode}
            setSelectedWeapon={setSelectedWeapon}
            selectedWeapon={selectedWeapon}
          />
        </Grid>
        <Grid className="Footer">
          <Footer />
        </Grid>
      </Grid>
    </>
  );
};

export default GamePage;
