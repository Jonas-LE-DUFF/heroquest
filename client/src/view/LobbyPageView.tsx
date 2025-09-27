import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GameState, Player } from "../shared/type";

interface LobbyPageProps {
  socket: any;
}

const LobbyPage: React.FC<LobbyPageProps> = ({ socket }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { playerName, gameId, role } = location.state || {};
  const [gameState, setGameState] = useState(location.state.gameState);
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
      gameState.players = data.players;

      setGameState((prevState: GameState) => {
        if (!prevState) return prevState;

        return {
          ...prevState,
          players: data.players,
        };
      });
    });
    // Écouter le début de la partie
    socket.on("game-start", (data: { gameState: GameState }) => {
      console.log("Game is starting...", data.gameState);
      navigate("/game", {
        state: { playerName, gameId, role, gameState: data.gameState },
      });
    });

    socket.on("game-state-update", (data: { gameState: GameState }) => {
      setGameState(data.gameState);
    });

    return () => {
      socket.off("lobby-update");
      socket.off("game-start");
      socket.off("game-state-update");
    };
  }, [location.state, navigate, playerName, gameId, role, socket, gameState]);

  const toggleReady = () => {
    console.log("Toggling ready state...");
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    socket.emit("player-ready", {
      gameId,
      newReadyState,
      ready: newReadyState,
      playerId: socket.id,
    });
  };

  const startGame = () => {
    console.log("🔄 Tentative de lancement de la partie...");

    socket.emit("start-game", { gameId });

    socket.once("error", (error: any) => {
      console.log("❌ Erreur:", error);
      alert(`Erreur: ${error}`);
    });
  };

  function renderStatus(players: Player[]) {
    console.log("render status", players);
    if (!players || !Array.isArray(players)) {
      return <div>Aucun Joueur</div>;
    }
    return players
      .map((player: Player) => {
        // ✅ Vérification complète
        if (!player || typeof player !== "object") {
          return null;
        }

        const isReady = Boolean(player.ready);
        const characterName = player.characterName || "Joueur sans nom";
        const role = player.role || "hero";

        return (
          <div key={player.id} className="player-item">
            <span>{characterName}</span>
            <span className={`status ${isReady ? "ready" : "not-ready"}`}>
              {isReady ? "✅ Prêt" : "❌ Non prêt"}
            </span>
            <span className="role">{role === "game-master" ? "👑" : "🎭"}</span>
          </div>
        );
      })
      .filter(Boolean); // Retire les null
  }

  // const canStartGame = players.length >= 2 && players.every((p) => p.ready);
  // const isGameMaster = role === "game-master";

  return (
    <div className="lobby-page">
      <h1>Lobby - {gameId}</h1>
      <p>
        Bienvenue, <strong>{playerName}</strong> (
        {role === "game-master" ? "👑 Maître du Jeu" : "🎭 Héros"})
      </p>
      {renderStatus(gameState.players)}
      <div className="players-list">
        <h2>
          Joueurs connectés (
          {gameState.players ? gameState.players.length : "0"}
          /5)
        </h2>
      </div>

      <div className="lobby-actions">
        <button
          onClick={toggleReady}
          className={`ready-button ${isReady ? "ready" : ""}`}
        >
          {isReady === false ? "Se déclarer prêt" : "Prêt"}
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
          <li>Il ne peut y avoir qu'un seul Maitre du jeu</li>
        </ul>
      </div>
    </div>
  );
};

export default LobbyPage;
