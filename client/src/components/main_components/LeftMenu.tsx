import React from "react";
import StatsComponent from "../large_components/StatsComponent";
import "./LeftMenu.css";
import { Socket } from "socket.io-client";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { MonsterAsJson } from "../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";

interface LeftMenuProps {
  statsVisible: boolean;
  socket: Socket;
  selectedUnit: HeroAsJson | MonsterAsJson | null;
  setStatsVisible: (arg0: boolean) => void;
}

const LeftMenu: React.FC<LeftMenuProps> = ({
  statsVisible,
  socket,
  selectedUnit,
  setStatsVisible,
}) => {
  return (
    <>
      {statsVisible && selectedUnit && (
        <div className="game-controls">
          <StatsComponent
            socket={socket}
            unit={selectedUnit}
            setStatsVisible={setStatsVisible}
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
