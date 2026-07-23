import React from "react";
import StatsComponent from "../large_components/StatsComponent";
import "./LeftMenu.css";
import { Dialog } from "@mui/material";
import { Socket } from "socket.io-client";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { MonsterAsJson } from "../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { PlayerRole } from "../../POO/enums/PlayerRole";
import { GenericDiceRoller } from "../dices/GenericDiceRoller";

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
      <div className="dices hero">
        <GenericDiceRoller
          kind="red"
          socket={socket}
          diceOwner={PlayerRole.HERO}
        />
        <GenericDiceRoller
          kind="fight"
          socket={socket}
          diceOwner={PlayerRole.HERO}
        />
      </div>
      <div className="dices game-master">
        <GenericDiceRoller
          kind="red"
          socket={socket}
          diceOwner={PlayerRole.GAME_MASTER}
        />
        <GenericDiceRoller
          kind="fight"
          socket={socket}
          diceOwner={PlayerRole.GAME_MASTER}
        />
      </div>
      <Dialog
        open={statsVisible && selectedUnit !== null}
        onClose={() => setStatsVisible(false)}
        aria-labelledby="unit-stats-dialog"
        sx={{
          "& .MuiDialog-paper": {
            background: "transparent",
            boxShadow: "none",
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "calc(100vh - 32px)",
            margin: 0,
            overflow: "visible",
          },
        }}
      >
        <div className="game-controls">
          {selectedUnit !== null && (
            <StatsComponent
              socket={socket}
              unit={selectedUnit}
              setStatsVisible={setStatsVisible}
            />
          )}
        </div>
      </Dialog>

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
