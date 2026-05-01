import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GameAsJson } from "../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { PlayerRole } from "../POO/enums/PlayerRole";
import PlayerStatusComponent from "../components/large_components/PlayerStatusComponent";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import Card from "@mui/material/Card";
import "./LobbyPageView.css";

interface LobbyPageProps {
  socket: Socket;
}

const LobbyPage: React.FC<LobbyPageProps> = ({ socket }) => {
  const state = useLocation().state as {
    playerName: string;
    game: GameAsJson;
    playerId: string;
  };
  const navigate = useNavigate();

  const playerName : string = state.playerName;
  const [game, setgame] = useState<GameAsJson | null>(state.game);
  const gameId = game?.id;
  const role: PlayerRole | undefined = game?.players?.find(
    (p) => p.id === socket.id,
  )?.role;

  useEffect(() => {
    if (!game || !playerName) {
      console.error(
        `Données manquantes : nom du joueur : ${playerName}, nom de la partie : ${game?.name}, redirection...`,
      );
      void navigate("/");
      return;
    }

    const handleGameStart = (data: { game: GameAsJson }) => {
      const game = data.game;
      console.log("Game is starting...", game);
      void navigate("/game", {
        state: { playerName, gameId, role, game: game, playerId: state.playerId },
      });
    };

    const handlegameUpdate = (data: { game: GameAsJson }) => {
      setgame(data.game);
    };

    // Écouter les mises à jour des joueurs
    socket.on("game-start", handleGameStart);
    socket.on("game-state-update", handlegameUpdate);

    return () => {
      socket.off("game-start", handleGameStart);
      socket.off("game-state-update", handlegameUpdate);
    };
  }, [navigate, playerName, socket, game, gameId, role, state.playerId]);

  const startGame = () => {
    socket.emit(
      "start-game",
      { gameId },
      (response: { success: boolean; error?: string; data?: GameAsJson }) => {
        if (response.success) {
          const game = response.data;
          void navigate("/game", {
            state: { playerName, gameId, role, game, playerId: state.playerId },
          });
        } else {
          toast.error(`Erreur: ${response.error}`);
        }
      },
    );
  };

  const leaveLobby = () => {
    socket.emit(
      "leave-lobby",
      { gameId },
      () => {
        void navigate("/");
      },
    );
  };

  const chooseCharacter = () => {
    if (!game) {
      toast.error("Game state is missing. Cannot proceed to character selection.");
      void navigate("/");
      return;
    }

    void navigate("/characterChoice", {
      state: {
        game,
        playerName,
        gameId,
        role,
        playerId: state.playerId,
      },
    });
  };

  const unselectCharacter = (heroId: string) => {
    if (!game) {
      toast.error("Game state is missing. Cannot proceed to character unselection.");
      void navigate("/");
      return;
    }
    socket.emit(
      "unselect-character",
      { gameId, heroId },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          console.error("Error unselecting character:", response.error);
          toast.error(`Error: ${response.error}`);
        }
      },
    );
  };

  const prepareGame = () => {
    void navigate("/gamePreparation", {
      state: {
        game,
        playerName,
        gameId,
        role,
        playerId: state.playerId,
      },
    });
  };

  if (!game) {
    void navigate("/");
    return null;
  }
  const canStartGame = game.isLaunchable.success;
  const isGameMaster = role === PlayerRole.GAME_MASTER;
  const players = game.players;

  return (
    <Card className="lobby-page">
      <h1>Lobby - {game.name}</h1>
      <p>
        Bienvenue, <strong>{playerName}</strong> (
        {role === PlayerRole.GAME_MASTER ? "Maître du Jeu" : "Héros"})
      </p>
      {game && (
        <PlayerStatusComponent
          game={game}
          unselectCharacter={unselectCharacter}
        />
      )}
      <div className="players-list">
        <h2>Joueurs connectés ({game && players ? players.length : "0"}/5)</h2>
      </div>

      <div className="lobby-actions">
        {isGameMaster && (
          <>
            {canStartGame && (
              <button className="positive-button" onClick={startGame}>
                lancer la partie
              </button>
            )}
            <button className="classic-button" onClick={prepareGame}>
              Préparer la partie
            </button>
          </>
        )}
        <button className="warning-button" onClick={leaveLobby}>
          Sortir du Lobby
        </button>
        {!isGameMaster && (
          <button className="classic-button" onClick={chooseCharacter}>
            Choisir son personnage
          </button>
        )}
      </div>
    </Card>
  );
};

export default LobbyPage;
