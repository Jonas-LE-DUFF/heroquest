import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPageView.css";
import { GameAsJson } from "../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import { MenuItem, Paper, Select } from "@mui/material";
import { LocationState } from "../POO/types/LocationType";

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
            game: data.game,
            playerId: data.playerId,
          } as LocationState,
        });
      },
    );
    return () => {
      socket.off("join-success");
    };
  }, [socket, navigate, playerName]);

  return (
    <div className="page-container">
      <Paper elevation={5} className="login-page">
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
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as PlayerRole)}
            >
              <MenuItem value={PlayerRole.HERO}>Héros</MenuItem>
              <MenuItem value={PlayerRole.GAME_MASTER}>Maître du Jeu</MenuItem>
            </Select>
          </div>

          <button type="submit" className="positive-button">
            Rejoindre la partie
          </button>
        </form>
      </Paper>
    </div>
  );
};

export default LoginPage;
