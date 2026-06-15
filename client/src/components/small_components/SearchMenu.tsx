import * as React from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import searchIcon from "/assets/images/icons/navbar/search.svg";
import drawCardIcon from "/assets/images/icons/navbar/search-treasure.svg";
import trapSearch from "/assets/images/icons/navbar/search-traps.svg";
import secretDoorIcon from "/assets/images/icons/navbar/search-secret-doors.svg";
import { Tooltip } from "@mui/material";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { useLocation } from "react-router-dom";
import { LocationState } from "../../POO/types/LocationType";

export default function SearchMenu(socket: Socket, hero: HeroAsJson) {
  const state = useLocation().state as LocationState;
  const { game, playerId } = state;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const isHeroTurn = game.playOrder[game.currentTurnIndex] === hero?.category && game.isMonsterTurn === false;

  function searchSecretDoors(): void {
    socket.emit(
      "check-secret-doors",
      { gameId: game.id, playerId: playerId, heroId: hero?.id },
      (response: {
        success: boolean;
        trapCardId?: string;
        error?: string;
        data?: { message: string };
      }) => {
        if (!response.success) {
          console.error(
            "Erreur lors de la recherche de pièges : " + response.error,
          );
          toast.error(
            `Erreur lors de la recherche de pièges : ${response.error}`,
          );
        } else {
          if (response?.data?.message) {
            toast.info(response.data.message);
          }
        }
      },
    );
  }

  function searchTreasures() {
    console.debug("searchTreasures called for hero", hero?.name); // Debug log
    socket.emit(
      "check-for-treasures",
      { gameId: game.id, playerId: playerId, heroId: hero?.id },
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
          if (response?.data?.message) {
            toast.info(response.data?.message);
          }
        }
      },
    );
  }

  function searchTraps(): void {
    socket.emit(
      "check-for-traps",
      { gameId: game.id, playerId: playerId, heroId: hero?.id },
      (response: {
        success: boolean;
        trapCardId?: string;
        error?: string;
        data?: { message: string };
      }) => {
        if (!response.success) {
          console.error(
            "Erreur lors de la recherche de pièges : " + response.error,
          );
          toast.error(
            `Erreur lors de la recherche de pièges : ${response.error}`,
          );
        } else {
          if (response?.data?.message) {
            toast.info(response.data.message);
          }
        }
      },
    );
  }

  return (
    <div className="nav-elem">
      <Button
        id="basic-button"
        disabled={!isHeroTurn}
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
      >
        <Tooltip title="Option de fouille" arrow>
          <img src={searchIcon} alt="Search" className="img-nav icon-nav" />
        </Tooltip>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#cfb898',
            },
          },
        }}
      >
        <MenuItem onClick={() => searchTreasures()}>
          <Tooltip title="Rechercher des trésors" arrow>
            <img src={drawCardIcon} alt="Draw Card" className="img-nav icon-nav" />
          </Tooltip>
        </MenuItem>
        <MenuItem onClick={() => searchTraps()}>
          <Tooltip title="Rechercher des pièges" arrow>
            <img src={trapSearch} alt="Trap search" className="img-nav icon-nav" />
          </Tooltip>
        </MenuItem>
        <MenuItem onClick={() => searchSecretDoors()}>
          <Tooltip title="Rechercher des portes secrètes" arrow>
            <img src={secretDoorIcon} alt="Secret Door" className="img-nav icon-nav" />
          </Tooltip>
        </MenuItem>
      </Menu>
    </div>
  );
}
