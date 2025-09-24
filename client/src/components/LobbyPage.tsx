import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface LobbyPageProps {
  socket: any;
}

interface Player {
  id: string;
  name: string;
  role: string;
  ready: boolean;
}

const LobbyPage: React.FC<LobbyPageProps> = ({ socket }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { playerName, gameId, role } = location.state || {};

  const [players, setPlayers] = useState<Player[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log("📍 LobbyPage montée");
    console.log("Données de navigation:", location.state);

    if (!playerName || !gameId) {
      console.log("❌ Données manquantes, redirection...");
      navigate("/");
      return;
    }

    console.log(
      "✅ Données OK - Player:",
      playerName,
      "Game:",
      gameId,
      "Role:",
      role
    );
    // Écouter les mises à jour des joueurs
    socket.on("lobby-update", (data: { players: Player[] }) => {
      setPlayers(data.players);
    });

    // Écouter le début de la partie
    socket.on("game-start", (data: { gameState: any }) => {
      const gameState = data.gameState;
      console.log("Game is starting...", gameState);
      navigate("/game", { state: { playerName, gameId, role, gameState } });
    });

    // Demander l'état actuel du lobby
    socket.emit("get-lobby-state", { gameId });

    return () => {
      socket.off("lobby-update");
      socket.off("game-start");
    };
  }, [location.state, navigate, playerName, gameId, role, socket]);

  const toggleReady = () => {
    console.log("Toggling ready state...");
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    socket.emit("player-ready", { gameId, ready: newReadyState });
  };

  const startGame = () => {
    console.log("🔄 Tentative de lancement de la partie...");
    console.log("Game ID:", gameId);
    console.log("Socket ID:", socket.id);

    socket.emit("start-game", { gameId });

    // Ajouter un écouteur pour debug
    socket.once("game-start", (gameState: any) => {
      console.log("✅ Réception game-start:", gameState);
      navigate("/game", { state: { gameState, playerName, gameId, role } });
    });

    socket.once("error", (error: any) => {
      console.log("❌ Erreur:", error);
      alert(`Erreur: ${error}`);
    });
  };

  const canStartGame = players.length >= 2 && players.every((p) => p.ready);
  const isGameMaster = role === "game-master";

  return (
    <div className="lobby-page">
      <h1>Lobby - {gameId}</h1>
      <p>
        Bienvenue, <strong>{playerName}</strong> (
        {role === "game-master" ? "👑 Maître du Jeu" : "🎭 Héros"})
      </p>

      <div className="players-list">
        <h2>Joueurs connectés ({players.length}/5)</h2>
        {players.map((player) => (
          <div key={player.id} className="player-item">
            <span>{player.name}</span>
            <span className={`status ${player.ready ? "ready" : "not-ready"}`}>
              {player.ready ? "✅ Prêt" : "❌ Non prêt"}
            </span>
            <span className="role">
              {player.role === "game-master" ? "👑" : "🎭"}
            </span>
          </div>
        ))}
      </div>

      <div className="lobby-actions">
        <button
          onClick={toggleReady}
          className={`ready-button ${isReady ? "ready" : ""}`}
        >
          {isReady ? "Prêt" : "Se déclarer prêt"}
        </button>

        {/* {isGameMaster && ( */}
        <button onClick={startGame} className="start-button">
          lancer la partie
        </button>
        {/* )} */}
      </div>

      <div className="game-rules">
        <h3>Règles du jeu :</h3>
        <ul>
          <li>Les héros coopèrent pour accomplir des quêtes</li>
          <li>Le Maître du Jeu contrôle les monstres et les pièges</li>
          <li>Chaque héros a 3 actions par tour</li>
        </ul>
      </div>
    </div>
  );
};

export default LobbyPage;
