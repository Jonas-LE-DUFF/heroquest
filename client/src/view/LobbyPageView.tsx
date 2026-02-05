import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GameAsJson } from "../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { SpellElement } from "../POO/enums/SpellElement";
import { HeroAsJson } from "../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { PlayerAsJson } from "../POO/interfaces/ClassAsJson/Server/PlayerAsJson";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { getHeroByPlayerId } from "../shared/serverUtils";

interface LobbyPageProps {
  socket: any;
}

const LobbyPage: React.FC<LobbyPageProps> = ({ socket }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const playerName = location.state.playerName;
  const [game, setgame] = useState<GameAsJson | null>(location.state.game);
  const gameId = game?.id;
  const role: PlayerRole | undefined = game?.players?.find(
    (p) => p.id === socket.id,
  )?.role;

  useEffect(() => {
    if (!game || !playerName) {
      console.log("trucs qui marchent pas", playerName, game);

      console.log("Données manquantes, redirection...");
      navigate("/");
      return;
    }

    console.log(
      "Données OK - Player:",
      playerName,
      "Game:",
      gameId,
      "Role:",
      role,
    );

    const handleGameStart = (data: { game: GameAsJson }) => {
      const game = data.game;
      console.log("Game is starting...", game);
      navigate("/game", {
        state: { playerName, gameId, role, game: game },
      });
    };

    const handlegameUpdate = (data: { game: GameAsJson }) => {
      console.log("update of game state received");
      setgame(data.game);
    };

    // Écouter les mises à jour des joueurs
    socket.on("game-start", handleGameStart);
    socket.on("game-state-update", handlegameUpdate);

    return () => {
      socket.off("game-start", handleGameStart);
      socket.off("game-state-update", handlegameUpdate);
    };
  }, [navigate, playerName, socket, game, gameId, role]);

  const startGame = () => {
    console.log("Tentative de lancement de la partie...");

    socket.emit(
      "start-game",
      { gameId },
      (response: { success: boolean; error?: string; data?: GameAsJson }) => {
        if (response.success) {
          console.log("Partie lancée avec succès ! partie :", response.data);
          const game = response.data;
          navigate("/game", {
            state: { playerName, gameId, role, game },
          });
        } else {
          console.error(
            "Erreur lors du lancement de la partie:",
            response.error,
          );
          alert(`Erreur: ${response.error}`);
        }
      },
    );

    socket.once("error", (error: any) => {
      console.log("Erreur:", error);
      alert(`Erreur: ${error}`);
    });
  };

  const leaveLobby = () => {
    console.log("Leaving lobby");
    socket.emit(
      "leave-lobby",
      { gameId },
      (response: { success: boolean; error?: string }) => {
        if (response.success) {
          console.log("Left lobby successfully");
          navigate("/");
        } else {
          console.error("Error leaving lobby:", response.error);
          alert(`Error: ${response.error}`);
        }
      },
    );
  };

  const chooseCharacter = () => {
    if (!game) {
      alert("Game state is missing. Cannot proceed to character selection.");
      return;
    }

    navigate("/charaterChoice", {
      state: {
        game,
        playerName,
        gameId,
        role,
      },
    });
  };

  const unselectCharacter = () => {
    if (!game) {
      alert("Game state is missing. Cannot proceed to character unselection.");
      return;
    }
    socket.emit(
      "unselect-character",
      { gameId },
      (response: { success: boolean; error?: string }) => {
        if (response.success) {
          console.log("Character unselected successfully");
        } else {
          console.error("Error unselecting character:", response.error);
          alert(`Error: ${response.error}`);
        }
      },
    );
  };

  function renderSpellElements(spellElements: SpellElement[]) {
    if (spellElements.length === 0) return "Aucun";
    return spellElements
      .map((spellElement) => SpellElement[spellElement])
      .join(", ");
  }

  function renderHeroes(heroes: HeroAsJson[]) {
    if (heroes.length === 0) return "Pas encore choisi";
    return heroes.map((hero) => {
      let playerClass;
      if (hero.category === undefined) {
        playerClass = "ERREUR";
      } else {
        // TODO : should get the icon of the hero class
        playerClass = HeroCategory[hero.category];
      }
      const spellElements = hero.spells.map((spell) => spell.element) || [];
      return (
        <>
          <span className="Hero class">{playerClass}</span>
          <span className="spells">
            {" "}
            - Sorts: {renderSpellElements(spellElements)}
          </span>
        </>
      );
    });
  }

  function renderStatus(players: PlayerAsJson[]) {
    if (!players || players.length === 0) {
      return <div>Aucun Joueur</div>;
    }

    return players
      .map((player: PlayerAsJson) => {
        if (!player || typeof player !== "object") {
          return null;
        }

        let characterName = player?.name || "Joueur sans nom";

        const isGameMaster = player.role === "game-master";

        return (
          <div key={player.id} className="player-item">
            <span>{characterName}</span>
            {!isGameMaster && (
              <span
                className={`status ${player.isReady ? "ready" : "not-ready"}`}
              >
                {player.isReady ? "Prêt" : "Non prêt"}
              </span>
            )}
            <span className="role">
              {isGameMaster ? "[icon game-master]" : "[icon hero]"}
            </span>
          </div>
        );
      })
      .filter(Boolean);
  }
  if (!game) return <div>le game existe pu...</div>;
  const canStartGame = game.isLaunchable;
  const isGameMaster = role === PlayerRole.GAME_MASTER;
  const players = game.players;

  return (
    <div className="lobby-page">
      <h1>Lobby - {gameId}</h1>
      <p>
        Bienvenue, <strong>{playerName}</strong> (
        {role === PlayerRole.GAME_MASTER ? "Maître du Jeu" : "Héros"})
      </p>
      {game && renderStatus(players)}
      <div className="players-list">
        <h2>
          Joueurs connectés ({game && players ? players.length : "0"}
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
