import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Board from "../components/main_components/BoardComponent";
import { TileType } from "../POO/enums/Board/TileType";
import { PositionAsJson } from "../POO/interfaces/ClassAsJson/PositionAsJson";
import { BoardAsJson } from "../POO/interfaces/ClassAsJson/Board/BoardAsJson";
import { GameAsJson } from "../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";

interface GamePreparationProps {
  socket: Socket;
}

const GamePreparation: React.FC<GamePreparationProps> = ({ socket }) => {
  const state = useLocation().state as {
    playerName: string;
    game: GameAsJson;
  };
  const navigate = useNavigate();
  const playerName = state.playerName;
  const [game, setGame] = useState<GameAsJson>(state.game);

  useEffect(() => {
    if (!game || !playerName) {
      console.error("Données manquantes, redirection...");
      void navigate("/");
      return;
    }

    socket.on("game-state-update", (data: { game: GameAsJson }) => {
      setGame(data.game);
      state.game = data.game;
    });

    return () => {
      socket.off("game-state-update");
    }
  });

  const placeStairs = (pos: PositionAsJson) => {
    socket.emit(
      "place-element",
      {
        gameId: game.id,
        position: pos,
        selectedType: TileType.SPAWN_POINT,
      },
      (response: { success: boolean; error?: string; data: BoardAsJson }) => {
        if (response.success) {
          const newBoard: BoardAsJson = response.data;
          setGame({
            ...game,
            gameState: { ...game.gameState, board: newBoard },
          });
        } else {
          console.error("Failed to place stairs:", response.error);
          toast.error("Failed to place stairs: " + response.error);
        }
      },
    );
  };
  

  const goToLobby = () => {
    void navigate("/lobby", {
      state: { playerName: playerName, game: game },
    });
  };

  return (
    <div className="game-preparation">
      <h1>Préparation de la partie...</h1>
      <Board
        game={game}
        onTileClick={(position) => {
          placeStairs(position);
        }}
        selectedPosition={null}
        selectedType={null}
      />
      <button onClick={goToLobby}>
        Retour au lobby
      </button>
    </div>
  );
};

export default GamePreparation;
