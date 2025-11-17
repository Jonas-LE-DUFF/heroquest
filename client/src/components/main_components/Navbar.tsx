import React from "react";
import { Socket } from "socket.io-client";
import { heroClass, Player } from "../../shared/type";
import "./Navbar.css";
import { getHeroClassIconPath, getHeroClassName } from "../../shared/utils";

interface NavbarProps {
  socket: Socket;
  gameId: string;
  player?:Player
}

const Navbar: React.FC<NavbarProps> = ({ socket, gameId, player }) => {

  console.log("nav player : ",player);
  
  if (!player || !player.stats) {
    return <div>Loading...</div>;
  }
  return (
  <div className="Navbar">
    <div className="nav-elem">Navbar</div>
    {player.role === "hero" && player.class && <div className="nav-elem"><img src={getHeroClassIconPath(player.class)} alt={getHeroClassName(player.class)} /></div>}
    <div className="nav-elem">Game ID: {gameId}</div>
    <div className="nav-elem">Player: {player.stats.name}</div>

  </div>
  );
};

export default Navbar;
