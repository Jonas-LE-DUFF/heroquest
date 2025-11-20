import React from "react";
import StatsComponent from "../StatsComponent";
import "./LeftMenu.css";

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
    <div className="left-menu">
      {statsVisible && (
        <StatsComponent
          socket={socket}
          gameId={currentGameState.id}
          position={selectedPosition ?? { x: 0, y: 0 }}
          unit={selectedUnit}
          setStatsVisible={setStatsVisible}
          isGameMaster={role === "game-master"}
        />
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
    </div>
  );
};

export default LeftMenu;
