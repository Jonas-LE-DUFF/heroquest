import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface LobbyPageProps {
  socket: any;
}

const LobbyPage: React.FC<LobbyPageProps> = ({ socket }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const playerName = location.state.playerName;
  const [game, setgame] = useState<Game | null>(
    location.state.game
  );
  const gameId = game?.id;
  const role = game?.getPlayer(socket.id)?.role;

  useEffect(() => {
    if (!game || !playerName) {
      console.log("trucs qui marchent pas", playerName, game);

      console.log("Données manquantes, redirection...");
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

    const handleGameStart = (data: { game: Game }) => {
      const game = data.game;
      console.log("Game is starting...", game);
      navigate("/game", {
        state: { playerName, gameId, role, game: game },
      });
    };

    const handlegameUpdate = (data: { game: Game }) => {
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

    socket.emit("start-game", { gameId });

    socket.once("error", (error: any) => {
      console.log("Erreur:", error);
      alert(`Erreur: ${error}`);
    });
  };

  const leaveLobby = () => {
    console.log("Leaving lobby");
    socket.emit("leave-lobby", { gameId });

    navigate("/");
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
    socket.emit("unselect-character", { gameId });
  };

  function renderSpellElements(spellElements: SpellElement[]) {
    if (spellElements.length === 0) return "Aucun";
    return spellElements.map((spellElement) => SpellElement[spellElement]).join(", ");
  }

  function renderHeroes(heroes: Hero[]) {
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
          <span className="Hero class">
            {playerClass}
          </span>
          <span className="spells">
            {" "}
            - Sorts: {renderSpellElements(spellElements)}
          </span>
        </>
      );
    });
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
        const heroes: Hero[] = game
          ? game.gameState.getHeroesControlledByPlayer(player.id)
          : [];

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
            <span className="role">{isGameMaster ? "[icon game-master]" : "[icon hero]"}</span>
            {!isGameMaster && (
              <span className="heroes">
                {renderHeroes(heroes)}
              </span>
            )}

          </div>
        );
      })
      .filter(Boolean);
  }
  if (!game) return <div>le game existe pu...</div>;
  const canStartGame = game.gameState.isLaunchable();
  const isGameMaster = role === PlayerRole.GAME_MASTER;
  const players = game.getPlayers();

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
          Joueurs connectés (
          {game && players ? players.size : "0"}
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
