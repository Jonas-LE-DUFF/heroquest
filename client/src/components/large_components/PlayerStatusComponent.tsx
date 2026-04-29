import { useLocation, useNavigate } from "react-router-dom";
import { HeroCategory } from "../../POO/enums/Categories/HeroCategory";
import { PlayerRole } from "../../POO/enums/PlayerRole";
import { GameAsJson } from "../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { PlayerAsJson } from "../../POO/interfaces/ClassAsJson/Server/PlayerAsJson";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { getEquipmentAsCards } from "../../shared/equipments";
import { getPlayerHeroMap } from "../../shared/lobbyUtils";
import { getHeroClassIconPath } from "../../shared/utils";
import { CardComponent } from "../Card/CardComponent";
import { getSpellEllementAsCard } from "../Card/cardUtils";
import React from "react";

import GameMasterIcon from "/assets/images/icons/playerRole/IconGameMaster.jpeg";
import HeroIcon from "/assets/images/icons/playerRole/iconHero.jpeg";

interface PlayerStatusProps {
  game: GameAsJson;
  unselectCharacter: (heroId: string) => void;
}

const PlayerStatusComponent: React.FC<PlayerStatusProps> = ({
  game,
  unselectCharacter,
}) => {
  const state = useLocation().state as {
    playerId: string;
  };
  console.log("Rendering PlayerStatusComponent with game:", game);
  console.log("Player ID from state:", state.playerId);
  const player = game.players.find((p) => p.id === state.playerId);
  console.log("Player found in game:", player);
  const navigate = useNavigate();

  function modifyHero(hero: HeroAsJson) {
    void navigate("/characterChoice", {
      state: {
        game,
        playerName: player?.name,
        hero,
        playerId: state.playerId,
      },
    });
  }

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
          {heroes && getHeroesDetails(heroes, modifyHero)}
        </div>,
      );
    });
    return <div className="players-status">{statusElements}</div>;
  }
  function getHeroesDetails(
    heroes: HeroAsJson[],
    modifyHero: (hero: HeroAsJson) => void,
  ): React.ReactNode {
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
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                gap: "10px",
                flexDirection: "column",
              }}
            >
              {(player?.role === PlayerRole.GAME_MASTER ||
                player?.id === hero.controlledByPlayerId) && (
                  <>
                    <button
                      className="classic-button"
                      onClick={() => modifyHero(hero)}
                    >
                      modifier
                    </button>
                    <button
                      className="warning-button"
                      onClick={() => unselectCharacter(hero.id)}
                    >
                      déselectionner
                    </button>
                  </>
                )}
            </div>
          </span>,
        );
      }
    }
    return HeroDetailsElements;
  }

  return renderStatus(game) || <div>Aucun Joueur</div>;
};

export default PlayerStatusComponent;
