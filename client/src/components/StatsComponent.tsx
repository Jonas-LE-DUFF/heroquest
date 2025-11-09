import { Box, LinearProgress, Paper } from "@mui/material";
import { heroClass, Monster, Player } from "../shared/type";
import { heroClassFr } from "../shared/frenchEnums";
import "./StatsComponent.css";
import { getFightDiceFaceNumber, getHeroClassIconPath } from "../shared/utils";

interface StatsComponentProps {
  socket: string;
  unit: Monster | Player;
  setStatsVisible: (arg0: boolean) => void;
}

function isPlayer(u: Monster | Player): u is Player {
  return (u as Player).class !== undefined;
}

const StatsComponent = ({
  socket,
  unit,
  setStatsVisible,
}: StatsComponentProps) => {
  if (!unit?.stats) return <Paper>ERROR</Paper>;

  return (
    <Paper sx={{ height: "100%" }}>
      <div className="content">
        <button onClick={() => setStatsVisible(false)} className="closeButton">
          X
        </button>
        <div className="stats">
          <p className="title">{unit.stats.name} Stats</p>
          {isPlayer(unit) && (unit as Player).class && (
            <div className="statElem">
              <p>Class : </p>
              <img
                className="heroClassIcon"
                src={getHeroClassIconPath(
                  (unit as Player).class ?? heroClass.Barbarian
                )}
                alt={`Icône de classe ${
                  heroClassFr[(unit as Player).class ?? heroClass.Barbarian]
                }`}
              />
            </div>
          )}
          <div className="statElem">
            <p>Nombre de dés en attaque : </p>
            {unit.stats?.nbAttackDice && getDices(unit.stats?.nbAttackDice)}
          </div>
          <div className="statElem">
            <p>Nombre de dés en défense : </p>
            {unit.stats?.nbDefenseDice && getDices(unit.stats?.nbDefenseDice)}
          </div>
          <div className="statElem">
            <p>Points d'esprit : </p>
            {unit.stats.spiritPoints}
          </div>
          {unit.stats?.hp && unit.stats.maxHp && (
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
                value={(unit.stats?.hp / unit.stats?.maxHp) * 100}
              />
              <p>{`${unit.stats?.hp} / ${unit.stats?.maxHp} HP`}</p>
            </Box>
          )}
          {isPlayer(unit) && (
            <div className="statElem">
              <p>Or : </p>
              {(unit as Player).gold}
            </div>
          )}
        </div>
      </div>
    </Paper>
  );
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
