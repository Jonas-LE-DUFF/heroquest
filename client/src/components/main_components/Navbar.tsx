import { Socket } from "socket.io-client";
import "./Navbar.css";
import {
  getHeroClassIconPath,
  getHeroClassName,
  isHero,
} from "../../shared/utils";
import { Dialog, Select, Tooltip } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { PlayerAsJson } from "../../POO/interfaces/ClassAsJson/Server/PlayerAsJson";
import { MonsterAsJson } from "../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { PlayerRole } from "../../POO/enums/PlayerRole";
import { useLocation } from "react-router-dom";
import { getHeroesByPlayerId, getHeroToPlay } from "../../shared/serverUtils";
import { GameAsJson } from "../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import backpackIcon from "/assets/images/icons/navbar/backpack.png";
import drawCardIcon from "/assets/images/icons/navbar/card-draw.png";
import { useState } from "react";
import EquipmentsDialogComponent from "../Card/Equipments/EquipmentsDialogComponent";
import { PlayerService } from "../../POO/PlayerService";
import { HeroCategory } from "../../POO/enums/Categories/HeroCategory";
import { renderHeroClassOptions } from "../../shared/selectHeroClass";

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
    console.log("Current hero:", hero);
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
    if (role === PlayerRole.HERO) {
      alert(
        "Pour recher des trésors veuillez demander au game master de le faire pour vous en cliquant sur le bouton de recherche de trésors dans la barre de navigation\n\n(Le système de recherche de trésors est en cours de développement et nécessite une interaction du game master pour le moment)",
      );
      return;
    }
    socket.emit(
      "check-for-treasures",
      { gameId: game.id, heroId: hero?.id },
      (response: {
        success: boolean;
        treasureCardId?: string;
        error?: string;
      }) => {
        if (response.success) {
          if (response.treasureCardId) {
            // Handle the case where treasures are found
          }
        }
      },
    );
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
                console.log("not yet implemented");
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
            <img
              src={backpackIcon}
              alt="Backpack"
              className="imgNav"
              onClick={() => {
                setShowEquipments(!showEquipments);
              }}
            />
          </div>
          <Dialog
            open={showEquipments}
            onClose={() => setShowEquipments(false)}
          >
            <EquipmentsDialogComponent socket={socket} hero={hero} />
          </Dialog>
        </>
      )}
      {role === PlayerRole.HERO &&
        currentlyPlayedHero?.id === getHeroToPlay(game)?.id && (
          <div className="nav-elem" onClick={() => searchTreasures()}>
            <img src={drawCardIcon} alt="Draw Card" className="imgNav" />
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
