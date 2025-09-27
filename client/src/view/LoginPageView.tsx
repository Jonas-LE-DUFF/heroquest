import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GameState } from "../shared/type";
interface LoginPageProps {
  socket: any;
}

const LoginPage: React.FC<LoginPageProps> = ({ socket }) => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [gameId, setGameId] = useState("");
  const [role, setRole] = useState<"hero" | "game-master">("hero");
  const [gameState, setGameState] = useState<GameState | null>(null);

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.trim() || !gameId.trim()) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    console.log("📤 Envoi des données:", gameId, playerName, role);
    // Émettre l'événement de connexion au serveur
    socket.emit("join-game", { gameId, playerName, role });

    // Écouter la réponse du serveur
    socket.once(
      "join-success",
      (data: { gameState: any; playerId: string }) => {
        // Naviguer vers la page du lobby/jeu
        console.log("data.gameState : ", data.gameState);
        setGameState(data.gameState);
        console.log("gameState : ", gameState);
        navigate("/lobby", {
          state: {
            playerName: playerName,
            gameId: gameId,
            role: role,
            gameState: data.gameState,
          },
        });
      }
    );

    socket.once("join-error", (error: string) => {
      alert(`Erreur: ${error}`);
    });

    socket.on("game-state-update", (data: { gameState: GameState }) => {
      console.log(data);

      if (!data.gameState) return;
      console.log("UPDTAE", data.gameState.players);

      setGameState(data.gameState);
    });
  };

  return (
    <div className="login-page">
      <h1>🎮 HeroQuest Online</h1>
      <form onSubmit={handleJoinGame} className="login-form">
        <div className="form-group">
          <label>Votre nom :</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Ex: Jean"
            required
          />
        </div>

        <div className="form-group">
          <label>ID de la partie :</label>
          <input
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Ex: partie-1"
            required
          />
        </div>

        <div className="form-group">
          <label>Rôle :</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "hero" | "game-master")}
          >
            <option value="hero">🎭 Héros</option>
            <option value="game-master">👑 Maître du Jeu</option>
          </select>
        </div>

        <button type="submit" className="join-button">
          Rejoindre la partie
        </button>
      </form>

      <div className="game-info">
        <h3>Comment jouer ?</h3>
        <p>• Créez une partie avec un ID unique</p>
        <p>• Partagez l'ID avec vos amis</p>
        <p>• Un joueur doit être le Maître du Jeu</p>
      </div>
    </div>
  );
};

export default LoginPage;
