import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GameAsJson } from "../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { SpellElement } from "../POO/enums/SpellElement";
import { HeroAsJson } from "../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { PlayerAsJson } from "../POO/interfaces/ClassAsJson/Server/PlayerAsJson";
import { PlayerRole } from "../POO/enums/PlayerRole";
import GameMasterIcon from "../../public/assets/images/icons/playerRole/IconGameMaster.jpeg";
import HeroIcon from "../../public/assets/images/icons/playerRole/iconHero.jpeg";
import { getPlayerHeroMap } from "../shared/lobbyUtils";
import { getHeroClassIconPath } from "../shared/utils";
import { getEquipmentAsCards } from "../shared/equipments";
import { CardComponent } from "../components/Card/CardComponent";
import {
  getSpellAsCard,
  getSpellEllementAsCard,
} from "../components/Card/cardUtils";

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

  const unselectCharacter = (heroId: string) => {
    if (!game) {
      alert("Game state is missing. Cannot proceed to character unselection.");
      return;
    }
    socket.emit(
      "unselect-character",
      { gameId, heroId },
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

  function renderStatus(game: GameAsJson) {
    const players = game?.players;
    if (!players || players.length === 0) {
      return <div>Aucun Joueur</div>;
    }
    const playerHeroMap = getPlayerHeroMap(game);
    const statusElements: React.ReactNode[] = [];
    playerHeroMap.forEach((heroes: HeroAsJson[], player: PlayerAsJson) => {
      let characterName = player.name || "Joueur sans nom";

      const isGameMaster = player.role === PlayerRole.GAME_MASTER;
      statusElements.push(
        <div key={player.id} className="player-item">
          <div className="player-row">
            <span>Nom : {characterName}</span>
            {!isGameMaster && (
              <span
                className={`status ${player.isReady ? "ready" : "not-ready"}`}
              >
                {player.isReady ? "Prêt" : "Non prêt"}
              </span>
            )}
            <span className="role">
              {isGameMaster ? (
                <img src={GameMasterIcon} alt="Game Master" className="icon" />
              ) : (
                <img src={HeroIcon} alt="Hero" className="icon" />
              )}
            </span>
          </div>
          {heroes && getHeroesDetails(heroes)}
        </div>,
      );
    });
    return <div className="players-status">{statusElements}</div>;
  }

  function getHeroesDetails(heroes: HeroAsJson[]): React.ReactNode {
    const HeroDetailsElements = [];
    for (const hero of heroes) {
      if (hero.category === undefined) {
        HeroDetailsElements.push("ERREUR");
      } else {
        HeroDetailsElements.push(
          <span key={hero.id} className="lobby-row">
            <img
              src={getHeroClassIconPath(hero.category)}
              alt={HeroCategory[hero.category]}
              className="icon"
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexDirection: "row",
                marginLeft: "10px",
                maxHeight: "200px",
              }}
            >
              {getEquipmentAsCards(hero.equipment).map((card) => (
                <CardComponent key={card.id} card={card} />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexDirection: "row",
                marginLeft: "10px",
                maxHeight: "200px",
              }}
            >
              {hero.spellElements
                .map((spell) => getSpellEllementAsCard(spell))
                .map((card) => (
                  <CardComponent key={card.id} card={card} />
                ))}
            </div>
            <button
              style={{ marginLeft: "auto" }}
              onClick={() => unselectCharacter(hero.id)}
            >
              déselectionner
            </button>
          </span>,
        );
      }
    }
    return HeroDetailsElements;
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
      {game && renderStatus(game)}
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
