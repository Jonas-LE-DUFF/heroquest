import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GamePageView.css";
import "./ChooseCharacterView.css";
import { GameAsJson } from "../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { HeroCreationWish } from "../POO/interfaces/ClassAsJson/FromClient/HeroCreationWish";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import { LocationState } from "../POO/types/LocationType";
import ChooseCharacterComponent from "../components/large_components/ChooseCharacterComponent";
import { Paper } from "@mui/material";

interface ChooseCharacterProps {
  socket: Socket;
}

const ChooseCharacter: React.FC<ChooseCharacterProps> = ({ socket }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const [game, setGame] = useState<GameAsJson>(state.game);

  const playerName =
    state.game.players.find((p) => p.id === state.playerId)?.name ||
    "Unknown Player";

  useEffect(() => {
    if (!game || !playerName) {
      console.error(
        `Données manquantes : ${playerName}, ${game.name}, redirection...`,
      );
      void navigate("/");
      return;
    }

    socket.on("game-state-update", (data: { game: GameAsJson }) => {
      setGame(data.game);
      state.game = data.game;
    });

    return () => {
      socket.off("game-state-update");
    };
  }, [navigate, playerName, game, socket, state]);

  const handleSubmit = (heroCreation: HeroCreationWish) => {
    if (!game) {
      toast.error("Game state is missing. Cannot submit character creation.");
      void navigate("/");
      return;
    }

    socket.emit(
      "choose-character",
      {
        heroCreationWish: heroCreation,
        gameId: game.id,
        playerId: state.playerId,
      },
      (response: { success: boolean; error?: string; data?: GameAsJson }) => {
        if (response.success && response.data) {
          void navigate("/lobby", {
            state: {
              playerName: playerName,
              game: response.data,
              playerId: state.playerId,
            },
          });
        } else {
          toast.error(`Error: ${response.error}`);
        }
      },
    );
  };

  const goBackToLobby = () => {
    void navigate("/lobby", {
      state: { playerName: playerName, game: game, playerId: state.playerId },
    });
  };

  return (
    <div className="page-container">
      <Paper elevation={5} className="character-page">
        <ChooseCharacterComponent
          socket={socket}
          cancelCallback={goBackToLobby}
          chooseCallback={handleSubmit}
          game={game}
        />
      </Paper>
    </div>
  );
};

export default ChooseCharacter;
