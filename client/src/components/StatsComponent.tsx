import { Box, LinearProgress, Paper } from "@mui/material";
import { Monster, Player, Position, Unit } from "../shared/type";
import "./StatsComponent.css";
import {
  getFightDiceFaceNumber,
  getIconClassPath,
  getUnitClassName,
  isPlayer,
} from "../shared/utils";
import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

interface StatsComponentProps {
  socket: Socket;
  gameId: string;
  position: Position;
  unit: Monster | Player | null;
  setStatsVisible: (arg0: boolean) => void;
  isGameMaster: boolean;
}

const StatsComponent = ({
  socket,
  gameId,
  position,
  unit,
  setStatsVisible,
  isGameMaster,
}: StatsComponentProps) => {
  const [statsEdit, setStatsEdit] = useState<Unit>(
    unit?.stats ?? { name: "no stats found" }
  );

  useEffect(() => {
    setStatsEdit(unit?.stats ?? { name: "no stats found" });
  }, [unit]);

  if (!unit?.stats) {
    console.log("no stats found");
    return <Paper>ERROR</Paper>;
  }
  return (
    <Paper sx={{ height: "100%" }}>
      <div className="content">
        <button onClick={() => setStatsVisible(false)} className="closeButton">
          X
        </button>
        <div className="stats">
          <p className="title">{statsEdit.name} Stats</p>
          {unit.class && (
            <div className="statElem">
              <p>Classe : </p>
              <img
                className="heroClassIcon"
                src={getIconClassPath(unit)}
                alt={`Icône de classe ${getUnitClassName(unit)}`}
              />
            </div>
          )}
          <div className="statElem">
            <p>Nombre de dés en attaque : </p>
            {statsEdit?.nbAttackDice && getDices(statsEdit.nbAttackDice)}
          </div>
          {isGameMaster && (
            <input
              value={statsEdit.nbAttackDice}
              onChange={(e) =>
                setStatsEdit({
                  ...statsEdit,
                  nbAttackDice: Number(e.target.value),
                })
              }
              type="number"
            />
          )}
          <div className="statElem">
            <p>Nombre de dés en défense : </p>
            {statsEdit.nbDefenseDice && getDices(statsEdit.nbDefenseDice)}
          </div>
          {isGameMaster && (
            <input
              value={statsEdit.nbDefenseDice}
              onChange={(e) =>
                setStatsEdit({
                  ...statsEdit,
                  nbDefenseDice: Number(e.target.value),
                })
              }
              type="number"
            />
          )}
          <div className="statElem">
            <p>Points d'esprit : </p>
            {statsEdit.spiritPoints}
          </div>
          {isGameMaster && (
            <input
              value={statsEdit.spiritPoints}
              onChange={(e) =>
                setStatsEdit({
                  ...statsEdit,
                  spiritPoints: Number(e.target.value),
                })
              }
              type="number"
            />
          )}
          {statsEdit?.hp && statsEdit.maxHp && (
            <Box
              sx={{
                width: "100%",
                borderRadius: "5px",
                height: "fit-content",
                mt: 2,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 1,
              }}
            >
              <LinearProgress
                sx={{ minWidth: "250px", borderRadius: "5px", height: "25px" }}
                color="error"
                variant="determinate"
                value={(statsEdit?.hp / statsEdit?.maxHp) * 100}
              />
              <p>{`${statsEdit?.hp} / ${statsEdit?.maxHp} HP`}</p>
            </Box>
          )}
          {isGameMaster && (
            <div>
              <label>HP : </label>
              <input
                value={statsEdit.hp}
                onChange={(e) =>
                  setStatsEdit({
                    ...statsEdit,
                    hp: Number(e.target.value),
                  })
                }
                type="number"
              />
            </div>
          )}
          {isGameMaster && (
            <div>
              <label>Max HP : </label>
              <input
                value={statsEdit.maxHp}
                onChange={(e) =>
                  setStatsEdit({
                    ...statsEdit,
                    maxHp: Number(e.target.value),
                  })
                }
                type="number"
              />
            </div>
          )}
          {isPlayer(unit) && (
            <div>
              <div className="statElem">
                <p>Or : </p>
                {statsEdit.gold}
              </div>
              {isGameMaster && (
                <input
                  value={statsEdit.gold}
                  onChange={(e) =>
                    setStatsEdit({
                      ...statsEdit,
                      gold: Number(e.target.value),
                    })
                  }
                  type="number"
                />
              )}
            </div>
          )}
          {isPlayer(unit) === false && (
            <div>
              <div className="statElem">
                <p>Déplacements : </p>
                {statsEdit.movements}
              </div>
              {isGameMaster && (
                <input
                  value={statsEdit.movements}
                  onChange={(e) =>
                    setStatsEdit({
                      ...statsEdit,
                      movements: Number(e.target.value),
                    })
                  }
                  type="number"
                />
              )}
            </div>
          )}
          {isGameMaster && (
            <button onClick={() => sendNewStats(statsEdit)}>Save Stats</button>
          )}
        </div>
      </div>
    </Paper>
  );
  function sendNewStats(newStats: Unit) {
    // Send the new stats to the server or update the state
    console.log("New stats to be saved: ", newStats);
    socket.emit(
      "update-stats-unit",
      { gameId, newStats, position },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          alert("Erreur lors de la mise à jour des stats : " + response.error);
        } else {
          console.log("Stats updated successfully");
        }
      }
    );
  }
};

function getDices(numDices: number) {
  const dices = [];
  for (let i = 0; i < numDices; i++) {
    dices.push(
      <div className="dice" key={"dice number" + i}>
        <img src={getFightDiceFaceNumber(i)} alt={`dé face`} />
      </div>
    );
  }
  return dices;
}

export default StatsComponent;
