import React from "react";
import StatsComponent from "../large_components/StatsComponent";
import "./LeftMenu.css";
import { PlayerRole } from "../../POO/enums/PlayerRole";
import { Socket } from "socket.io-client";
import { GameAsJson } from "../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { MonsterAsJson } from "../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";

interface LeftMenuProps {
  statsVisible: boolean;
  socket: Socket;
  currentGameState: GameAsJson;
  selectedUnit: HeroAsJson | MonsterAsJson | null;
  setStatsVisible: (arg0: boolean) => void;
  role: PlayerRole;
}

const LeftMenu: React.FC<LeftMenuProps> = ({
  statsVisible,
  socket,
  currentGameState,
  selectedUnit,
  setStatsVisible,
  role,
}) => {
  return (
    <>
      {statsVisible && selectedUnit && (
        <div className="game-controls">
          <StatsComponent
            socket={socket}
            gameId={currentGameState.id}
            unit={selectedUnit}
            setStatsVisible={setStatsVisible}
            isGameMaster={role === PlayerRole.GAME_MASTER}
          />
        </div>
      )}

      <div>
        {selectedUnit !== null && (
          <button
            className="classic-button"
            onClick={() =>
              selectedUnit !== null && setStatsVisible(!statsVisible)
            }
          >
            {!statsVisible ? "Montrer stats" : "Cacher stats"}
          </button>
        )}
      </div>
    </>
  );
};

export default LeftMenu;
