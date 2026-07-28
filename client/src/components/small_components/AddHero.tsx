import React, { useState } from "react";
import ChooseCharacter from "../large_components/ChooseCharacterComponent";
import { Socket } from "socket.io-client";
import { Dialog, MenuItem, Select } from "@mui/material";
import "./AddHero.css";
import { HeroCreationWish } from "../../POO/interfaces/ClassAsJson/FromClient/HeroCreationWish";
import { useLocation } from "react-router-dom";
import { LocationState } from "../../POO/types/LocationType";
import { PositionAsJson } from "../../POO/interfaces/ClassAsJson/PositionAsJson";
import { toast } from "react-toastify";

interface AddHeroProps {
  socket: Socket;
  position: PositionAsJson | null;
}

export const AddHero: React.FC<AddHeroProps> = ({ socket, position }) => {
  const state = useLocation().state as LocationState;
  const { game, playerId } = state || {};

  const [openDialog, setOpenDialog] = useState(false);
  const [ownerId, setOwnerId] = useState(playerId);
  const onAddHeroClick = (heroCreation: HeroCreationWish) => {
    // Logic to add a hero at the specified position
    setOpenDialog(false);
    socket.emit(
      "place-back-hero",
      {
        gameId: game.id,
        playerId,
        position,
        heroCreationWish: heroCreation,
        ownerId,
      },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          console.error(`Error adding hero: ${response.error}`);
          toast.error(`Error adding hero: ${response.error}`);
        }
      },
    );
  };
  const onCancelClick = () => {
    // Logic to cancel adding a hero
    console.log("Cancelled adding hero");
    setOpenDialog(false);
  };
  const playerOptions = game.players.map((player) => (
    <MenuItem key={player.id} value={player.id}>
      {player.name}
    </MenuItem>
  ));

  return (
    <>
      <button onClick={() => setOpenDialog(true)}>Add Hero</button>
      <Dialog
        open={openDialog}
        onClose={onCancelClick}
        sx={{
          "& .MuiDialog-paper": {
            width: "1200px",
            maxWidth: "1200px",
            height: "800px",
            maxHeight: "800px",
            overflow: "scroll",
          },
        }}
      >
        <div className="add-hero-dialog">
          <p>
            Add Hero at position: ({position?.x}, {position?.y})
          </p>
          <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            {playerOptions}
          </Select>
          <ChooseCharacter
            socket={socket}
            cancelCallback={onCancelClick}
            chooseCallback={onAddHeroClick}
            game={game}
          />
        </div>
      </Dialog>
    </>
  );
};
