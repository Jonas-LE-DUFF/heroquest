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
  getHeroesByPlayerId,
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
import { PlayerService } from "../POO/PlayerService";
import { TreasureCardAsJson } from "../POO/interfaces/ClassAsJson/Treasure/TreasureCardAsJson";

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

  const [game, setGame] = useState<GameAsJson>(location.state.game);
  const [boardKey, setBoardKey] = useState(0); // Force re-render key
  const user = game.players.find((p) => p.id === socket.id);
  const [hero, setHero] = useState<HeroAsJson | null>(
    getHeroesByPlayerId(socket.id, game)?.[0] || null,
  );
  if ((!hero || !isHero(hero)) && role !== PlayerRole.GAME_MASTER) {
    return <div>Couldn't find a hero you control</div>;
  }
  const [statsVisible, setStatsVisible] = useState(false);
  const [spellPageVisible, setSpellPageVisible] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState<string | null>(null);

  const [targetMode, setTargetMode] = useState<boolean>(false);

  let selectedWeapon = PlayerService.getHeroSelectedWeapon(hero);

  useEffect(() => {
    selectedWeapon = PlayerService.getHeroSelectedWeapon(hero);
  }, [hero]);

  // Handle stats update separately to ensure proper re-render
  const handleStatsUpdate = useCallback(
    (data: { entityId: string; newStats: StatsAsJson }) => {

      const isDead =
        data.newStats.health !== undefined && data.newStats.health <= 0;

      setGame((prev) => {
        if (!prev) return prev;
        const unit = prev.gameState.Units.find((u) => u.id === data.entityId);
        if (!unit) return prev;
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
        const unitId = getTileByPosition(
          selectedPosition,
          data.game.gameState.board,
        )?.unitId;
        if (unitId) setSelectedEntityId(unitId);
      }

      setGame(data.game);
      // Also increment board key on full game state updates
      // TODO : try to remove this setTimeout
      setBoardKey((k) => k + 1);
    });

    socket.on("stats-updated", handleStatsUpdate);

    socket.on(
      "tile-placed",
      (data: { position: PositionAsJson; TileType: TileType }) => {
        console.log("tile placed received in game page", data);
        setGame((prev) => {
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
        setGame((prev) => {
          if (!prev) return prev;
          game.gameState.board = setDoorAtPosition(
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

    socket.on(
      "card-drawn",
      (data: { hero: HeroAsJson; card: TreasureCardAsJson }) => {
        console.log("card drawn received in game page", data);
        setGame((prev) => {
          if (!prev) return prev;
          const heroIndex = prev.gameState.Units.findIndex(
            (u) => u.id === data.hero.id,
          );
          if (heroIndex === -1) return prev;
          prev.gameState.Units[heroIndex] = data.hero;
          return { ...prev } as GameAsJson;
        });
      },
    );

    return () => {
      socket.off("tile-placed");
      socket.off("door-placed");
      socket.off("stats-updated");
      socket.off("game-state-update");
      socket.off("card-drawn");
    };
  }, [socket, selectedPosition, selectedEntityId, handleStatsUpdate]);

  const setSelectedUnit = (unit: HeroAsJson | MonsterAsJson | null) => {
    if (!unit) return;
    const position = getPositionByUnitId(unit.id, game.gameState.board);
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
    if (!tile || !tile.unitId) return null;
    return game.gameState.Units.find((u) => u.id === tile.unitId) as
      | HeroAsJson
      | MonsterAsJson;
  };

  const handleTileClick = (
    position: PositionAsJson,
    selectedType: TileType | Direction | MonsterCategory | null,
  ) => {
    if (selectedSpell !== null) {
      socket.emit(
        "cast-spell",
        {
          gameId: game.id,
          spellId: selectedSpell,
          position: position,
        },
        (response: { success: boolean; error?: string }) => {
          if (!response.success) {
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
      const targetId = getTileByPosition(
        position,
        game.gameState.board,
      )?.unitId;
      const target = game.gameState.Units.find((u) => u.id === targetId);
      if (!target) {
        setTargetMode(false);
        return;
      }

      socket.emit(
        "attack",
        {
          gameId: game.id,
          attackerId: socket.id,
          targetId: target.id,
          weaponId: PlayerService.getHeroSelectedWeapon(hero) ?? undefined,
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

    if (
      selectedPosition !== null &&
      selectedPosition.x === position.x &&
      selectedPosition.y === position.y
    ) {
      setSelectedPosition(null);
      setSelectedEntityId(null);
      setStatsVisible(false);
    } else {
      setSelectedPosition(position);
      // set selected entity id based on current game state mapping
      const idAtPos = getTileByPosition(position, game.gameState.board)?.unitId;
      if (!idAtPos) {
        setStatsVisible(false);
      }
      setSelectedEntityId(idAtPos ?? null);
    }

    if (!selectedType) {
      return;
    }
    socket.emit(
      "place-element",
      {
        gameId: game.id,
        position,
        selectedType,
      },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
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
            game={game}
            isCurrentTurnPlayer={getPlayerIdToPlay(game) === socket.id || false}
            currentTurnPlayerName={
              getPlayerBySocketId(getPlayerIdToPlay(game) || "Unknown", game)
                ?.name || "Unknown"
            }
            player={user}
            statsOpen={statsVisible}
            selectedUnit={
              getSelectedUnit(selectedPosition, game.gameState.board) || null
            }
            setStatsOpen={setStatsVisible}
            setSelectedUnit={setSelectedUnit}
            openSpellPage={() => setSpellPageVisible(true)}
            setCurrentlyPlayedHero={setHero}
            currentlyPlayedHero={hero}
          />
        </Grid>
        <Grid className="LeftMenu">
          <LeftMenu
            statsVisible={statsVisible}
            socket={socket}
            currentGameState={game}
            selectedPosition={selectedPosition}
            selectedUnit={
              getSelectedUnit(selectedPosition, game.gameState.board) || null
            }
            setStatsVisible={setStatsVisible}
            role={role}
          />
        </Grid>

        <Grid className={"Board" + (targetMode ? " target" : "")}>
          <Board
            key={`board-${boardKey}`}
            game={game}
            onTileClick={handleTileClick}
            selectedPosition={selectedPosition}
            selectedEntityId={selectedEntityId}
            selectedType={selectedType}
          />
        </Grid>
        <Grid className="RightMenu">
          <RightMenu
            socket={socket}
            currentGameState={game}
            setSelectedType={setSelectedType}
            selectedType={selectedType}
            selectedUnit={
              getSelectedUnit(selectedPosition, game.gameState.board) || null
            }
            setTargetMode={setTargetMode}
            setSelectedWeapon={(weapon) => {
              setHero((prev) => {
                return {
                  ...prev,
                  equipment: {
                    ...prev?.equipment,
                    selectedWeaponIndex:
                      prev?.equipment.weapons.findIndex(
                        (w) => w.id === weapon,
                      ) ?? 0,
                  },
                } as HeroAsJson;
              });
              setTargetMode(true);
            }}
            selectedWeapon={selectedWeapon}
            hero={hero}
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
