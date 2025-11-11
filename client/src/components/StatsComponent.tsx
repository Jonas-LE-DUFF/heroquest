import { Box, LinearProgress, Paper } from "@mui/material";
import { Monster, Player, Position, Unit } from "../shared/type";
import "./StatsComponent.css";
import {
  getFightDiceFaceNumber,
  getIconClassPath,
  getUnitClassName,
} from "../shared/utils";
import { useState } from "react";

interface StatsComponentProps {
  socket: string;
  unit: Monster | Player | null;
  setStatsVisible: (arg0: boolean) => void;
  isGameMaster: boolean;
  position: Position;
}

function isPlayer(u: Monster | Player): u is Player {
  return (u as Player).class !== undefined;
}

const StatsComponent = ({
  socket,
  unit,
  setStatsVisible,
  isGameMaster,
  position,
}: StatsComponentProps) => {
  const [statsEdit, setStatsEdit] = useState<Unit>(
    unit?.stats ?? { name: "no stats found" }
  );

  const [gold, setGold] = useState<number>((unit as Player)?.gold ?? 0);

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
                src={getIconClassPath(unit.class)}
                alt={`Icône de classe ${getUnitClassName(unit.class)}`}
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
          )}
          {isGameMaster && (
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
          )}
          {isPlayer(unit) && (
            <div>
              <div className="statElem">
                <p>Or : </p>
                {gold}
              </div>
              {isGameMaster && (
                <input
                  value={gold}
                  onChange={(e) => setGold(Number(e.target.value))}
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
};

function sendNewStats(newStats: Unit) {
  // Send the new stats to the server or update the state
  console.log("New stats to be saved: ", newStats);
}

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
