import { Socket } from "socket.io-client";
import { Monster, Player } from "../../shared/type";
import "./Navbar.css";
import { getHeroClassIconPath, getHeroClassName } from "../../shared/utils";
import { Tooltip } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

interface NavbarProps {
  socket: Socket;
  gameId: string;
  player?: Player;
  isCurrentTurnPlayer: boolean;
  currentTurnPlayerName: string;
  statsOpen: boolean;
  setStatsOpen: (arg0: boolean) => void;
  setSelectedUnit: (arg0: Player | Monster | null) => void;
  openSpellPage: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  socket,
  gameId,
  player,
  isCurrentTurnPlayer,
  currentTurnPlayerName,
  statsOpen,
  setStatsOpen,
  setSelectedUnit,
  openSpellPage,
}) => {

  if (!player || !player.stats) {
    return <div>Loading...</div>;
  }

  function showSpells() {
    openSpellPage();
  }
  return (
    <div className="Navbar">
      <div className="nav-elem">Navbar</div>
      {player.role === "hero" && player.class && (
        <div className="nav-elem">
          <Tooltip
            title={statsOpen ? "Cacher statistiques" : "Voir statistiques"}
            arrow
          >
            <img
              className="imgNav"
              src={getHeroClassIconPath(player.class)}
              alt={getHeroClassName(player.class)}
              role="button"
              onClick={() => {
                console.log("not yet implemented");
                setSelectedUnit(player);
                setStatsOpen(!statsOpen);
              }}
            />
          </Tooltip>
        </div>
      )}
      <div className="nav-elem">Game ID: {gameId}</div>
      <div className="nav-elem">Votre nom: {player.stats.name}</div>
      <div className="nav-elem">Votre Rôle: {player.role}</div>
      {player?.stats?.spells && player.stats.spells.length > 0 && (
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
    </div>
  );
};

export default Navbar;
