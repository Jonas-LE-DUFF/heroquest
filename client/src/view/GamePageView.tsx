import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import Board from "../components/main_components/BoardComponent";
import "./GamePageView.css";
import { getHeroClassName, isHero } from "../shared/utils";
import Navbar from "../components/main_components/Navbar";
import RightMenu from "../components/main_components/RightMenu";
import { Dialog, Grid } from "@mui/material";
import LeftMenu from "../components/main_components/LeftMenu";
import SpellsPopUp from "../components/Card/Spells/SpellPopUp";
import { PositionAsJson } from "../POO/interfaces/ClassAsJson/PositionAsJson";
import { GameAsJson } from "../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { StatsAsJson } from "../POO/interfaces/ClassAsJson/Unit/StatsAsJson";
import { getPositionByUnitId, getTileByPosition } from "../shared/boardUtils";
import { HeroAsJson } from "../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { getHeroesByPlayerId } from "../shared/serverUtils";
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
import { Socket } from "socket.io-client";
import { LocationState } from "../POO/types/LocationType";

interface GamePageProps {
  socket: Socket;
}

const GamePage: React.FC<GamePageProps> = ({ socket }) => {
  const state = useLocation().state as LocationState;

  const player = state.game.players.find((p) => p.id === state.playerId);

  const role = player?.role;

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

  const [game, setGame] = useState<GameAsJson>(state.game);
  const [boardKey, setBoardKey] = useState(0); // Force re-render key
  const [hero, setHero] = useState<HeroAsJson | null>(
    getHeroesByPlayerId(player?.id ?? "", game)?.[0] || null,
  );

  const [statsVisible, setStatsVisible] = useState(false);
  const [spellPageVisible, setSpellPageVisible] = useState(false);
  const selectedWeapon = PlayerService.getHeroSelectedWeapon(hero);

  useEffect(() => {
    if (!game) {
      console.error("Game data is missing");
      return;
    }
    const hero = getHeroesByPlayerId(player?.id ?? "", game)?.[0] || null;
    if ((!hero || !isHero(hero)) && role !== PlayerRole.GAME_MASTER) {
      console.log(
        "Player is spectating, no hero found for player:",
        player?.id,
      );
    }
    setHero(hero);
  }, [game, player?.id, role]);

  // Handle stats update separately to ensure proper re-render
  const handleStatsUpdate = useCallback(
    (data: { entityId: string; newStats: StatsAsJson }) => {
      setGame((prev) => {
        if (!prev) return prev;
        const unit = prev.gameState.Units.find((u) => u.id === data.entityId);
        if (!unit) return prev;
        unit.stats = data.newStats;

        return { ...prev } as GameAsJson;
      });
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
      state.game = data.game; // Update the state with the new game data
      // Also increment board key on full game state updates
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

    const handlePlayerSearching = (data: {
      playerId: string;
      heroId: string;
      elementSearched: string;
    }) => {
      const hero = game.gameState.Units.find(
        (u) => u.id === data.heroId,
      ) as HeroAsJson;
      toast.info(
        `Le joueur ${player?.name || data.playerId} cherche des ${data.elementSearched} avec le/la ${getHeroClassName(hero.category)} `,
      );
    };

    socket.on("player-search", handlePlayerSearching);
    socket.on("game-state-update", handleGameStateUpdate);
    socket.on("stats-updated", handleStatsUpdate);
    socket.on("door-placed", handleDoorPlaced);
    socket.on("card-drawn", handleCardDrawn);

    return () => {
      socket.off("player-search", handlePlayerSearching);
      socket.off("door-placed", handleDoorPlaced);
      socket.off("stats-updated", handleStatsUpdate);
      socket.off("game-state-update", handleGameStateUpdate);
      socket.off("card-drawn", handleCardDrawn);
    };
  }, [
    socket,
    selectedPosition,
    selectedEntityId,
    handleStatsUpdate,
    game,
    player?.name,
    state,
  ]);

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
    playerId: player?.id ?? "",
    socket,
    hero,
    setStatsVisible,
    setGame,
  });

  if ((!hero || !isHero(hero)) && role !== PlayerRole.GAME_MASTER) {
    const playerHeroes = getHeroesByPlayerId(player?.id ?? "", game);
    if (playerHeroes && playerHeroes.length !== 0) {
      setHero(playerHeroes?.[0] || null);
    }
  }

  const selectedUnit = getSelectedUnit(selectedPosition, game.gameState.board);
  const onSpellClick = (selectedSpell: string) => {
    if (role === PlayerRole.GAME_MASTER) {
      socket.emit(
        "grant-back-spell",
        {
          gameId: game.id,
          playerId: player?.id ?? "",
          heroId: selectedUnit?.id ?? "",
          spellId: selectedSpell,
        },
        (response: { success: boolean; error?: string }) => {
          if (response.success) {
            toast.success("Sort rendu avec succès !");
          } else {
            toast.error("Erreur lors du rendu du sort : " + response.error);
          }
        },
      );
    } else {
      setInteraction((prev) => ({
        ...prev,
        targeting: { mode: "spell", spellId: selectedSpell },
      }));
    }
  };

  return (
    <>
      <Dialog
        open={spellPageVisible}
        onClose={() => setSpellPageVisible(false)}
        sx={{
          "& .MuiDialog-paper": {
            width: "80%",
            height: "80%",
            maxWidth: "80%",
            borderRadius: "10px",
            background: "none",
          },
        }}
      >
        <SpellsPopUp
          spellSchools={
            hero?.spellElements ??
            (selectedUnit && isHero(selectedUnit)
              ? (selectedUnit?.spellElements ?? [])
              : [])
          }
          spellAlreadyUsed={hero?.usedSpells.map((spell) => spell.id) ?? []}
          onSpellClick={onSpellClick}
          closeSpellPage={() => setSpellPageVisible(false)}
        />
      </Dialog>
      <Grid className={"game-page"} container>
        <Grid className="Navbar">
          <Navbar
            socket={socket}
            game={game}
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
            }}
            selectedWeapon={selectedWeapon}
            selectedPosition={selectedPosition}
          />
        </Grid>
        <Grid className="LeftMenu">
          <LeftMenu
            statsVisible={statsVisible}
            socket={socket}
            selectedUnit={
              getSelectedUnit(selectedPosition, game.gameState.board) || null
            }
            setStatsVisible={setStatsVisible}
          />
        </Grid>

        <Grid className={"Board" + (targetMode ? " target" : "")}>
          <Board
            key={`board-${boardKey}`}
            game={game}
            onTileClick={handleTileClick}
            selectedPosition={selectedPosition}
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
            hero={hero}
            setInteraction={setInteraction}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default GamePage;
