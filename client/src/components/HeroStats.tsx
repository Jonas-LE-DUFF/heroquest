import { Box, LinearProgress, Paper } from "@mui/material";
import { Player } from "../shared/type";
import { heroClassFr } from "../shared/frenchEnums";
import "./HeroStats.css";
import { getFightDiceFaceNumber, getHeroClassIconPath } from "../shared/utils";

interface HeroStatsProps {
  socket: string;
  player: Player;
  setStatsVisible: (arg0: boolean) => void;
}

const HeroStats = ({ socket, player, setStatsVisible }: HeroStatsProps) => {
  if (!player?.stats) return <Paper>ERROR</Paper>;

  return (
    <Paper sx={{ height: "100%" }}>
      <div className="content">
        <button onClick={() => setStatsVisible(false)} className="closeButton">
          X
        </button>
        <div className="stats">
          <p className="title">{player.characterName} Stats</p>
          {player.class && (
            <div className="statElem">
              <p>Class : </p>
              <img
                className="heroClassIcon"
                src={getHeroClassIconPath(player.class)}
                alt={`Icône de classe ${heroClassFr[player.class]}`}
              />
            </div>
          )}
          <div className="statElem">
            <p>Nombre de dés en attaque : </p>
            {getDices(player.stats?.nbAttackDice)}
          </div>
          <div className="statElem">
            <p>Nombre de dés en défense : </p>
            {getDices(player.stats?.nbDefenseDice)}
          </div>
          <div className="statElem">
            <p>Points d'esprit : </p>
            {player.stats.spiritPoints}
          </div>
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
              value={(player.stats?.hp / player.stats?.maxHp) * 100}
            />
            <p>{`${player.stats?.hp} / ${player.stats?.maxHp} HP`}</p>
          </Box>
          <div className="statElem">
            <p>Or : </p>
            {player.gold}
          </div>
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

export default HeroStats;
