import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPageView.css";
import { GameAsJson } from "../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import { Paper } from "@mui/material";

interface LoginPageProps {
  socket: Socket;
}

const LoginPage: React.FC<LoginPageProps> = ({ socket }) => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("a");
  const [gameName, setGameName] = useState("a");
  const [role, setRole] = useState<PlayerRole>(PlayerRole.HERO);

  const handleJoinGame = (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!playerName.trim() || !gameName.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    socket.emit(
      "join-game",
      { gameName, playerName, role },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          toast.error(`Erreur: ${response.error}`);
          return;
        }
      },
    );
  };

  useEffect(() => {
    socket.once(
      "join-success",
      async (data: { playerId: string; game: GameAsJson }) => {
        await navigate("/lobby", {
          state: {
            playerName: playerName,
            game: data.game,
            playerId: data.playerId,
          },
        });
      },
    );
    return () => {
      socket.off("join-success");
    };
  }, [socket, navigate, playerName]);

  return (
    <Paper elevation={5} className="login-page">
      <h1>HeroQuest Online</h1>
      <form onSubmit={handleJoinGame} className="login-form">
        <div className="form-group">
          <p>Votre nom :</p>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Ex: Jean"
            required
          />
        </div>

        <div className="form-group">
          <p>Nom de la partie :</p>
          <input
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="Ex: partie-1"
            required
          />
        </div>

        <div className="form-group">
          <p>Rôle :</p>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as PlayerRole)}
          >
            <option value={PlayerRole.HERO}>Héros</option>
            <option value={PlayerRole.GAME_MASTER}>Maître du Jeu</option>
          </select>
        </div>

        <button type="submit" className="positive-button">
          Rejoindre la partie
        </button>
      </form>

      <div className="game-info">
        <h3>Comment jouer ?</h3>
        <p>• Créez une partie avec un ID unique</p>
        <p>• Partagez l&apos;ID avec vos amis</p>
        <p>• Un joueur doit être le Maître du Jeu</p>
      </div>
    </Paper>
  );
};

export default LoginPage;
