import React from "react";
import StatsComponent from "../StatsComponent";
import "./LeftMenu.css";
import { PlayerRole } from "../../POO/enums/PlayerRole";

interface LeftMenuProps {
  statsVisible: boolean;
  socket: any;
  currentGameState: any;
  selectedPosition: any;
  selectedUnit: any;
  setStatsVisible: (arg0: boolean) => void;
  role: string;
}

const LeftMenu: React.FC<LeftMenuProps> = ({
  statsVisible,
  socket,
  currentGameState,
  selectedPosition,
  selectedUnit,
  setStatsVisible,
  role,
}) => {
  return (
    <>
      {statsVisible && (
        <div className="game-controls">
          <StatsComponent
            socket={socket}
            gameId={currentGameState.id}
            position={selectedPosition ?? { x: 0, y: 0 }}
            unit={selectedUnit}
            setStatsVisible={setStatsVisible}
            isGameMaster={role === PlayerRole.GAME_MASTER}
          />
        </div>
      )}

      <div>
        {selectedUnit !== null && (
          <button
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
