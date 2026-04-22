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
import { PositionAsJson } from "../POO/interfaces/ClassAsJson/PositionAsJson";
import { GameAsJson } from "../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { StatsAsJson } from "../POO/interfaces/ClassAsJson/Unit/StatsAsJson";
import {
  getPositionByUnitId,
  getTileByPosition,
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
import { TileType } from "../POO/enums/Board/TileType";
import { setDoorAtPosition } from "../shared/doorUtils";
import { MonsterAsJson } from "../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { BoardAsJson } from "../POO/interfaces/ClassAsJson/Board/BoardAsJson";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { PlayerService } from "../POO/PlayerService";
import { CardAsJson } from "../POO/interfaces/ClassAsJson/CardAsJson";
import { toast } from "react-toastify";
import RotatableCard3D from "../components/small_components/RotatableCard3D";
import { SelectType } from "../POO/types/selectType";
import useBoardTileClickHandlers, {
  InteractionState,
  TargetingState,
} from "./hooks/useBoardTileClickHandlers";

interface GamePageProps {
  socket: any;
}

const GamePage: React.FC<GamePageProps> = ({ socket }) => {
  const location = useLocation();
  const role = location.state.role;

  const [interaction, setInteraction] = useState<InteractionState>({
    selectedType: null,
    selectedPosition: null,
    selectedEntityId: null,
    targeting: { mode: "none" },
  });
  const selectedType = interaction.selectedType;
  const selectedPosition = interaction.selectedPosition;
  const selectedEntityId = interaction.selectedEntityId;
  const targetMode = interaction.targeting.mode !== "none";

  const getPlacementTargetingState = (type: SelectType): TargetingState =>
    type ? { mode: "placingSelectedType" } : { mode: "none" };

  const setSelectedType = (type: SelectType) => {
    setInteraction((prev) => ({
      ...prev,
      selectedType: type,
      targeting: getPlacementTargetingState(type),
    }));
  };

  const setTargetMode = (value: boolean) => {
    setInteraction((prev) => ({
      ...prev,
      targeting: value
        ? { mode: "attack" }
        : getPlacementTargetingState(prev.selectedType),
    }));
  };

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
  const selectedWeapon = PlayerService.getHeroSelectedWeapon(hero);

  useEffect(() => {
    if (!game) {
      console.error("Game data is missing");
      return;
    }
    const hero = getHeroesByPlayerId(socket.id, game)?.[0] || null;
    if ((!hero || !isHero(hero)) && role !== PlayerRole.GAME_MASTER) {
      console.error("Couldn't find a hero for the current player");
      return;
    }
    setHero(hero);
  }, [game, socket.id, role]);

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
    const handleGameStateUpdate = (data: { game: GameAsJson }) => {
      console.log("c'est l'update du gamePage", data.game);
      const selectedId = selectedEntityId;
      if (selectedId) {
        //if the selected entity moved, the selection follows
        const pos = getPositionByUnitId(selectedId, data.game.gameState.board);
        if (pos) {
          setInteraction((prev) => ({
            ...prev,
            selectedPosition: pos,
            selectedEntityId: selectedId,
          }));
        } else {
          setInteraction((prev) => ({
            ...prev,
            selectedPosition: null,
            selectedEntityId: null,
          }));
        }
      } else if (selectedPosition) {
        const unitId = getTileByPosition(
          selectedPosition,
          data.game.gameState.board,
        )?.unitId;
        if (unitId) {
          setInteraction((prev) => ({ ...prev, selectedEntityId: unitId }));
        }
      }

      setGame(data.game);
      // Also increment board key on full game state updates
      // TODO : try to remove this setTimeout
      setBoardKey((k) => k + 1);
    };

    const handleTilePlaced = (data: {
      position: PositionAsJson;
      TileType: TileType;
    }) => {
      console.log("tile placed received in game page", data);
      setGame((prev) => {
        if (!prev) return prev;

        setTileTypeAtPosition(data.position, data.TileType, prev.gameState.board);

        return { ...prev } as GameAsJson;
      });

      // TODO : try to remove this setTimeout
      setBoardKey((k) => k + 1);
    };

    const handleDoorPlaced = (data: {
      position: PositionAsJson;
      verticalOrHorizontal: "vertical" | "horizontal";
    }) => {
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
    };

    const handleCardDrawn = (data: { hero: HeroAsJson; card: CardAsJson }) => {
      console.log("card drawn received in game page", data);
      toast.info(RotatableCard3D, {
        data: data.card,
        style: { minWidth: "fit-content" },
        icon: false,
      });
      setGame((prev) => {
        if (!prev) return prev;
        const heroIndex = prev.gameState.Units.findIndex(
          (u) => u.id === data.hero.id,
        );
        if (heroIndex === -1) return prev;
        prev.gameState.Units[heroIndex] = data.hero;
        return { ...prev } as GameAsJson;
      });
    };

    socket.on("game-state-update", handleGameStateUpdate);
    socket.on("stats-updated", handleStatsUpdate);
    socket.on("tile-placed", handleTilePlaced);
    socket.on("door-placed", handleDoorPlaced);
    socket.on("card-drawn", handleCardDrawn);

    return () => {
      socket.off("tile-placed", handleTilePlaced);
      socket.off("door-placed", handleDoorPlaced);
      socket.off("stats-updated", handleStatsUpdate);
      socket.off("game-state-update", handleGameStateUpdate);
      socket.off("card-drawn", handleCardDrawn);
    };
  }, [socket, selectedPosition, selectedEntityId, handleStatsUpdate]);

  const setSelectedUnit = (unit: HeroAsJson | MonsterAsJson | null) => {
    if (!unit) return;
    const position = getPositionByUnitId(unit.id, game.gameState.board);
    if (!position) return;
    setInteraction((prev) => ({
      ...prev,
      selectedPosition: position,
      selectedEntityId: unit.id,
    }));
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

  const { handleTileClick } = useBoardTileClickHandlers({
    interaction,
    setInteraction,
    game,
    socket,
    hero,
    setStatsVisible,
    setGame,
  });

  return (
    <>
      {spellPageVisible && (
        <SpellsPopUp
          socket={socket}
          spellSchools={hero?.spellElements}
          spellAlreadyUsed={hero?.usedSpells.map((spell) => spell.id) ?? []}
          onSpellClick={(selectedSpell: string) => {
            setInteraction((prev) => ({
              ...prev,
              targeting: { mode: "spell", spellId: selectedSpell },
            }));
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
            setInteraction={setInteraction}
          />
        </Grid>
        <Grid className="LeftMenu">
          <LeftMenu
            statsVisible={statsVisible}
            socket={socket}
            currentGameState={game}
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
            setInteraction={setInteraction}
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
