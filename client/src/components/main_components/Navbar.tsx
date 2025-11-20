import { Socket } from "socket.io-client";
import { Monster, Player } from "../../shared/type";
import "./Navbar.css";
import { getHeroClassIconPath, getHeroClassName } from "../../shared/utils";
import { Tooltip } from "@mui/material";

interface NavbarProps {
  socket: Socket;
  gameId: string;
  player?: Player;
  statsOpen: boolean;
  setStatsOpen: (arg0: boolean) => void;
  setSelectedUnit: (arg0: Player | Monster | null) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  socket,
  gameId,
  player,
  statsOpen,
  setStatsOpen,
  setSelectedUnit,
}) => {
  console.log("nav player : ", player);

  if (!player || !player.stats) {
    return <div>Loading...</div>;
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
      <div className="nav-elem">Player: {player.stats.name}</div>
    </div>
  );
};

export default Navbar;
