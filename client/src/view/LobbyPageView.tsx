import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  GameState,
  Player,
  SendableGameState,
  spellElement,
} from "../shared/type";
import {
  convertSendableGameStateAsGameState,
  everyOneReady,
  getElementName,
  getHeroClassName,
} from "../shared/utils";

interface LobbyPageProps {
  socket: any;
}

const LobbyPage: React.FC<LobbyPageProps> = ({ socket }) => {
  const location = useLocation();
  const navigate = useNavigate();
  console.log("loaction", location);

  const playerName = location.state.playerName;
  const [gameState, setGameState] = useState<GameState | null>(
    location.state.game
  );
  const gameId = gameState?.id;
  const role = gameState?.players.get(socket.id)?.role;

  useEffect(() => {
    if (!gameState || !playerName) {
      console.log("trucs qui marchent pas", playerName, gameState);

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

  const chooseCharacter = () => {
    if (!gameState) {
      alert("Game state is missing. Cannot proceed to character selection.");
      return;
    }

    navigate("/charaterChoice", {
      state: {
        gameState,
        playerName,
        gameId,
        role,
      },
    });
  };

  const unselectCharacter = () => {
    if (!gameState) {
      alert("Game state is missing. Cannot proceed to character unselection.");
      return;
    }
    socket.emit("unselect-character", { gameId });
  };

  function renderSpellElements(spells: spellElement[]) {
    if (spells.length === 0) return "Aucun";
    return spells.map((spell) => getElementName(spell)).join(", ");
  }

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

        let characterName = player.characterName || "Joueur sans nom";
        let playerClass;
        if (player.class === undefined) {
          playerClass = "Non choisi";
        } else {
          playerClass = getHeroClassName(player.class);
        }
        let spells = player.spells || [];
        const isGameMaster = player.role === "game-master";

        return (
          <div key={player.id} className="player-item">
            <span>{characterName}</span>
            {!isGameMaster && (
              <span
                className={`status ${player.ready ? "ready" : "not-ready"}`}
              >
                {player.ready ? "✅ Prêt" : "❌ Non prêt"}
              </span>
            )}
            <span className="role">{isGameMaster ? "👑" : "🎭"}</span>
            {!isGameMaster && (
              <span className="class">Classe - {playerClass}</span>
            )}
            {!isGameMaster && (
              <span className="spells">
                {" "}
                - Sorts: {renderSpellElements(spells)}
              </span>
            )}
            {isGameMaster && <span></span>}
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
        {isGameMaster && canStartGame && (
          <button onClick={startGame} className="start-button">
            lancer la partie
          </button>
        )}
        <button onClick={leaveLobby} className="leave-button">
          Sortir du Lobby
        </button>
        {!isGameMaster && (
          <button onClick={chooseCharacter} className="chooseCharacter">
            Choisir son personnage
          </button>
        )}
        {!isGameMaster &&
          gameState.players.get(socket.id)?.class !== undefined && (
            <button onClick={unselectCharacter} className="unselectCharacter">
              Retirer son personnage
            </button>
          )}
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
