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
import { getEquipmentName } from "../shared/equipments";

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
    unit?.stats ?? { name: "no stats found", statusEffects: [] }
  );

  useEffect(() => {
    setStatsEdit(unit?.stats ?? { name: "no stats found", statusEffects: [] });
  }, [unit]);

  if (!unit?.stats) {
    console.log("no stats found on : ", unit);
    setStatsVisible(false);
    return null;
  }
  return (
    <Paper sx={{ height: "fit-content" }}>
      <div className="content">
        <button onClick={() => setStatsVisible(false)} className="closeButton">
          X
        </button>
        <div className="stats">
          <p>{statsEdit.name} Stats</p>
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
            {statsEdit?.nbAttackDice && getDices(statsEdit.nbAttackDice)}
          </div>
          <div className="statElem">
            <p>Nombre de dés en défense : </p>
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
            {statsEdit.nbDefenseDice && getDices(statsEdit.nbDefenseDice)}
          </div>
          <div className="statElem">
            <p>Points d'esprit : </p>
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
            {!isGameMaster && statsEdit.spiritPoints}
          </div>
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
            <div className="statElem">
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
            <div className="statsElem">
              <label>Max HP : </label>
              <input
                className="statsElem"
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
            <div className="statElem">
              <p>Or : </p>
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
              {!isGameMaster && statsEdit.gold}
            </div>
          )}
          {isPlayer(unit) === false && (
            <div className="statElem">
              <p>Déplacements : </p>
              {statsEdit.movements}

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
          <div className="statElem">
            <p>Effets : </p>
            <ul>
              {statsEdit.statusEffects && statsEdit.statusEffects.length > 0 ? (
                statsEdit.statusEffects.map((status, index) => (
                  <li key={index}>
                    {status?.effectName} - Durée: {status?.duration} - Sort lié:
                    {status?.relatedSpell}
                    {isGameMaster && (
                      <button
                        onClick={() => {
                          const newStatusEffects =
                            statsEdit.statusEffects?.filter(
                              (statusEffect) => statusEffect !== status
                            );
                          setStatsEdit({
                            ...statsEdit,
                            statusEffects: newStatusEffects,
                          });
                        }}
                      >
                        X
                      </button>
                    )}
                  </li>
                ))
              ) : (
                <li>Aucun effets</li>
              )}
            </ul>
          </div>
          {isGameMaster && (
            <div className="statElem">
              <input
                type="text"
                placeholder="Nom de l'effet"
                id="effectName"
              />
              <button onClick={() => {
                const effectNameInput = document.getElementById("effectName") as HTMLInputElement;
                const effectName = effectNameInput.value;
                if (effectName.trim() === "") return;
                const newStatusEffect = { effectName, duration: "donné par le MJ", relatedSpell: "N/A" };
                setStatsEdit({
                  ...statsEdit,
                  statusEffects: [...(statsEdit.statusEffects || []), newStatusEffect],
                });
                effectNameInput.value = "";
              }}>Ajouter effet</button>
            </div>
          )}
          {isPlayer(unit) && (
            <div className="statElem">
              <p>Equipements : </p>
              <ul>
                {statsEdit.equipments && statsEdit.equipments.length > 0 ? (
                  statsEdit.equipments.map((equipment, index) => (
                    <li key={index}>{getEquipmentName(equipment)}</li>
                  ))
                ) : (
                  <li>Aucun équipement</li>
                )}
              </ul>
            </div>
          )

          }
          {isGameMaster && (
            <button onClick={() => sendNewStats(statsEdit)}>Save Stats</button>
          )}
        </div>
      </div>
    </Paper>
  );
  function sendNewStats(newStats: Unit) {
    // Send the new stats to the server or update the state
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
        <img
          className="diceImage"
          src={getFightDiceFaceNumber(i)}
          alt={`dé face`}
        />
      </div>
    );
  }
  return dices;
}

export default StatsComponent;
