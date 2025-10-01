import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GameState, Player, SendableGameState } from "../shared/type";
import {
  convertSendableGameStateAsGameState,
  everyOneReady,
} from "../shared/utils";

interface LobbyPageProps {
  socket: any;
}

const LobbyPage: React.FC<LobbyPageProps> = ({ socket }) => {
  const location = useLocation();
  const navigate = useNavigate();
  console.log(location);

  const playerName = location.state.playerName;
  const [gameState, setGameState] = useState<GameState | null>(
    location.state.game
  );
  const gameId = gameState?.id;
  const role = gameState?.players.get(socket.id)?.role;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (gameState?.players?.get(socket.id)) {
      setIsReady(gameState.players.get(socket.id)!.ready);
    }
  }, [gameState, socket.id]);

  useEffect(() => {
    if (!gameState || !playerName) {
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

    const handleGameStart = (data: { gameState: SendableGameState }) => {
      const game = convertSendableGameStateAsGameState(data.gameState);
      console.log("Game is starting...", game);
      navigate("/game", {
        state: { playerName, gameId, role, gameState: game },
      });
    };

    const handleGameStateUpdate = (data: { gameState: SendableGameState }) => {
      console.log("update of game state received");
      const convertedGameState = convertSendableGameStateAsGameState(
        data.gameState
      );
      setGameState(convertedGameState);
    };

    // Écouter les mises à jour des joueurs
    socket.on("game-start", handleGameStart);
    socket.on("game-state-update", handleGameStateUpdate);

    return () => {
      socket.off("game-start", handleGameStart);
      socket.off("game-state-update", handleGameStateUpdate);
    };
  }, [navigate, playerName, socket, gameState, gameId, role]);

  const toggleReady = () => {
    console.log("Toggling ready state...");
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    socket.emit("player-ready", {
      gameId,
      ready: newReadyState,
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

  const leaveLobby = () => {
    console.log("leaving lobby");
    socket.emit("leave-lobby", { gameId });

    navigate("/");
  };

  function renderStatus(players: Map<string, Player>) {
    if (!players || players.size === 0) {
      return <div>Aucun Joueur</div>;
    }

    const playersAsArray = Array.from(players.values());
    return playersAsArray
      .map((player: Player) => {
        if (!player || typeof player !== "object") {
          return null;
        }

        const isReady = Boolean(player.ready);
        const characterName = player.characterName || "Joueur sans nom";
        const playerRole = player.role || "hero";

        return (
          <div key={player.id} className="player-item">
            <span>{characterName}</span>
            <span className={`status ${isReady ? "ready" : "not-ready"}`}>
              {isReady ? "✅ Prêt" : "❌ Non prêt"}
            </span>
            <span className="role">
              {playerRole === "game-master" ? "👑" : "🎭"}
            </span>
          </div>
        );
      })
      .filter(Boolean);
  }
  if (!gameState) return <div>le gameState existe pu...</div>;
  const canStartGame = gameState.players.size >= 2 && everyOneReady(gameState);
  const isGameMaster = role === "game-master";

  return (
    <div className="lobby-page">
      <h1>Lobby - {gameId}</h1>
      <p>
        Bienvenue, <strong>{playerName}</strong> (
        {role === "game-master" ? "👑 Maître du Jeu" : "🎭 Héros"})
      </p>
      {gameState && renderStatus(gameState.players)}
      <div className="players-list">
        <h2>
          Joueurs connectés (
          {gameState && gameState.players ? gameState.players.size : "0"}
          /5)
        </h2>
      </div>

      <div className="lobby-actions">
        <button
          onClick={toggleReady}
          className={`ready-button ${isReady ? "ready" : ""}`}
        >
          {isReady === false ? "Se déclarer prêt" : "Se déclarer non prêt"}
        </button>

        {isGameMaster && canStartGame && (
          <button onClick={startGame} className="start-button">
            lancer la partie
          </button>
        )}
        <button onClick={leaveLobby} className="leave-button">
          Sortir du Lobby
        </button>
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
