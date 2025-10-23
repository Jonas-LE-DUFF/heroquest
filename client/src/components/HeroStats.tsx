import { Box, LinearProgress, Paper, Typography } from "@mui/material";
import { Player } from "../shared/type";
import "./HeroStats.css";

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
        <p>{player.characterName} Stats</p>
        <div className="stats">
          <Box sx={{ topMargin: "10px", width: "80%", height: "5px", mr: 1 }}>
            <LinearProgress
              color="error"
              variant="determinate"
              value={(player.stats.hp / player.stats.maxHp) * 100}
            />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary" }}
            >{`${player.stats?.hp} / ${player.stats?.maxHp} HP`}</Typography>
          </Box>
          <p>Classe : {player.class}</p>
          <p>Nombre de dés en attaque : {player.stats?.nbAttackDice}</p>
          <p>Nombre de dés en défense : {player.stats?.nbDefenseDice}</p>
          <p>Classe : {player.class}</p>
          <p>Classe : {player.class}</p>
          <p>Classe : {player.class}</p>
        </div>
      </div>
    </Paper>
  );
};

export default HeroStats;
