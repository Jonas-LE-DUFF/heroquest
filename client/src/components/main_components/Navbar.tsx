import { Socket } from "socket.io-client";
import "./Navbar.css";
import {
  getHeroClassIconPath,
  getHeroClassName,
  isHero,
} from "../../shared/utils";
import { Dialog, Menu, MenuItem, Select, Tooltip } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { PlayerAsJson } from "../../POO/interfaces/ClassAsJson/Server/PlayerAsJson";
import { MonsterAsJson } from "../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { PlayerRole } from "../../POO/enums/PlayerRole";
import { useLocation } from "react-router-dom";
import { getHeroesByPlayerId } from "../../shared/serverUtils";
import { GameAsJson } from "../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import backpackIcon from "/assets/images/icons/navbar/pixelArt/backpack.png";
import drawCardIcon from "/assets/images/icons/navbar/pixelArt/search-treasure.png";
import lockpicks from "/assets/images/icons/navbar/pixelArt/disarm-trap.png";
import { Dispatch, SetStateAction, useState } from "react";
import EquipmentsDialogComponent from "../Card/Equipments/EquipmentsDialogComponent";
import { PlayerService } from "../../POO/PlayerService";
import { HeroCategory } from "../../POO/enums/Categories/HeroCategory";
import { renderHeroClassOptions } from "../../shared/selectHeroClass";
import { toast } from "react-toastify";
import { InteractionState } from "../../view/hooks/useBoardTileClickHandlers";
import SearchMenu from "../small_components/SearchMenu";

interface NavbarProps {
  socket: Socket;
  game: GameAsJson;
  player?: PlayerAsJson;
  isCurrentTurnPlayer: boolean;
  currentTurnPlayerName: string;
  statsOpen: boolean;
  selectedUnit: HeroAsJson | MonsterAsJson | null;
  currentlyPlayedHero: HeroAsJson | null;
  setCurrentlyPlayedHero: (arg0: HeroAsJson | null) => void;
  setStatsOpen: (arg0: boolean) => void;
  setSelectedUnit: (arg0: HeroAsJson | MonsterAsJson | null) => void;
  openSpellPage: () => void;
  setInteraction: Dispatch<SetStateAction<InteractionState>>;
}

const Navbar: React.FC<NavbarProps> = ({
  socket,
  game,
  player,
  isCurrentTurnPlayer,
  currentTurnPlayerName,
  statsOpen,
  selectedUnit,
  setStatsOpen,
  setSelectedUnit,
  openSpellPage,
  currentlyPlayedHero,
  setCurrentlyPlayedHero,
  setInteraction,
}) => {
  const location = useLocation();
  const role = location.state.role;
  const playerName = location.state.playerName;

  const [showEquipments, setShowEquipments] = useState(false);

  if (!player) {
    return <div>Loading...</div>;
  }
  let hero: HeroAsJson | null = null;
  if (role === PlayerRole.HERO) {
    hero = currentlyPlayedHero;
  } else {
    if (selectedUnit && isHero(selectedUnit)) hero = selectedUnit as HeroAsJson;
  }
  if (!hero && role === PlayerRole.HERO) {
    return <div>Loading...</div>;
  }

  function showSpells() {
    openSpellPage();
  }
  function searchTreasures() {
    console.debug("searchTreasures called for hero", hero?.name); // Debug log
    socket.emit(
      "check-for-treasures",
      { gameId: game.id, heroId: hero?.id },
      (response: {
        success: boolean;
        treasureCardId?: string;
        data?: { message: string };
        error?: string;
      }) => {
        if (!response.success) {
          console.error(
            "Erreur lors de la recherche de trésors : " + response.error,
          );
          toast.error(
            `Erreur lors de la recherche de trésors : ${response.error}`,
          );
        } else {
          if (response?.data?.message){
            toast.info(response.data?.message);
          }
        }
      },
    );
  }

  function disarmTrap(): void {
    setInteraction((prev: InteractionState) => ({
      ...prev,
      targeting: { mode: "disarmTrap" },
    }));
  }

  return (
    <div className="Navbar">
      <div className="nav-elem">Navbar</div>
      {player.role === PlayerRole.HERO && hero?.category && (
        <div className="nav-elem">
          <Tooltip
            title={statsOpen ? "Cacher statistiques" : "Voir statistiques"}
            arrow
          >
            <img
              className="imgNav"
              src={getHeroClassIconPath(hero.category)}
              alt={getHeroClassName(hero.category)}
              role="button"
              onClick={() => {
                setSelectedUnit(hero);
                setStatsOpen(!statsOpen);
              }}
            />
          </Tooltip>
        </div>
      )}
      <div className="nav-elem">Nom de la partie: {game.name}</div>
      <div className="nav-elem">Votre nom: {playerName}</div>
      <div className="nav-elem">Votre Rôle: {role}</div>
      {hero?.spells && hero.spells.length > 0 && (
        <div className="nav-elem">
          <Tooltip title="Voir mes sorts" arrow>
            <AutoAwesomeIcon
              className="imgNav"
              role="button"
              onClick={() => showSpells()}
            />
          </Tooltip>
        </div>
      )}
      <div className="nav-elem">
        {isCurrentTurnPlayer
          ? "À toi de jouer !"
          : "Au tour de " + currentTurnPlayerName}
      </div>
      {hero && (
        <>
          <div className="nav-elem">
            <Tooltip title="Voir mon équipement" arrow>
              <img
                src={backpackIcon}
                alt="Backpack"
                className="imgNav"
                onClick={() => {
                  setShowEquipments(!showEquipments);
                }}
              />
            </Tooltip>
          </div>
          <Dialog
            open={showEquipments}
            onClose={() => setShowEquipments(false)}
          >
            <EquipmentsDialogComponent socket={socket} hero={hero} />
          </Dialog>
        </>
      )}
      {hero && role !== PlayerRole.HERO && (
        <div className="nav-elem" onClick={() => searchTreasures()}>
          <Tooltip title="Rechercher des trésors" arrow>
            <img src={drawCardIcon} alt="Draw Card" className="imgNav" />
          </Tooltip>
        </div>
      )}
      {role === PlayerRole.HERO && SearchMenu(socket, game, hero)}
      {role === PlayerRole.HERO && (
        <div className="nav-elem" onClick={() => disarmTrap()}>
          <Tooltip title="Désarmer un piège" arrow>
            <img src={lockpicks} alt="Lockpicks" className="imgNav" />
          </Tooltip>
        </div>
      )}
      {role === PlayerRole.HERO && (
        <div className="nav-elem">
          <Select
            labelId="label-hero-class"
            id="select-hero-class"
            value={currentlyPlayedHero?.category || ""}
            onChange={(e) => {
              const newCategory = e.target.value as HeroCategory;
              setCurrentlyPlayedHero(
                PlayerService.getHeroByCategory(game, player.id, newCategory),
              );
            }}
            autoWidth
            sx={{ background: "white" }}
          >
            {renderHeroClassOptions(
              // disabling heroes the player doesn't control
              new Set(
                Object.entries(HeroCategory)
                  .filter(([key, value]) => {
                    const hero = getHeroesByPlayerId(player.id, game)?.find(
                      (h) => h.category === value,
                    );
                    return isNaN(Number(key)) && !hero;
                  })
                  .map(([key, value]) => value as HeroCategory),
              ),
            )}
          </Select>
        </div>
      )}
    </div>
  );
};

export default Navbar;
