import { Socket } from "socket.io-client";
import "./Navbar.css";
import { getHeroClassIconPath, getHeroClassName } from "../../shared/utils";
import { Dialog, Tooltip } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { PlayerAsJson } from "../../POO/interfaces/ClassAsJson/Server/PlayerAsJson";
import { MonsterAsJson } from "../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { PlayerRole } from "../../POO/enums/PlayerRole";
import { useLocation } from "react-router-dom";
import { getHeroByPlayerId } from "../../shared/serverUtils";
import { GameAsJson } from "../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import backpackIcon from "../../../public/assets/images/icons/navbar/backpack.png";
import { useState } from "react";
import EquipmentsDialogComponent from "../Card/Equipments/EquipmentsDialogComponent";

interface NavbarProps {
  socket: Socket;
  game: GameAsJson;
  player?: PlayerAsJson;
  isCurrentTurnPlayer: boolean;
  currentTurnPlayerName: string;
  statsOpen: boolean;
  selectedUnit: HeroAsJson | MonsterAsJson | null;
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
    hero = getHeroByPlayerId(player.id, game);
  } else {
    hero = selectedUnit as HeroAsJson;
  }
  if (!hero && role === PlayerRole.HERO) {
    return <div>Loading...</div>;
  }

  function showSpells() {
    openSpellPage();
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
    </div>
  );
};

export default Navbar;
