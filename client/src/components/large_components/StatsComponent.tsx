import { Box, LinearProgress, Paper } from "@mui/material";
import "./StatsComponent.css";
import {
  getFightDiceFaceNumber,
  getIconClassPath,
  getUnitClassName,
} from "../../shared/utils";
import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { MonsterAsJson } from "../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { StatsAsJson } from "../../POO/interfaces/ClassAsJson/Unit/StatsAsJson";
import { toast } from "react-toastify";
import { getRedDiceFace } from "../dices/RedDicesComponent";

interface StatsComponentProps {
  socket: Socket;
  gameId: string;
  unit: MonsterAsJson | HeroAsJson;
  setStatsVisible: (arg0: boolean) => void;
  isGameMaster: boolean;
}

const StatsComponent = ({
  socket,
  gameId,
  unit,
  setStatsVisible,
  isGameMaster,
}: StatsComponentProps) => {
  const [statsEdit, setStatsEdit] = useState<StatsAsJson>(unit.stats);

  useEffect(() => {
    setStatsEdit(unit.stats);
  }, [unit.stats]);

  if (!unit?.stats) {
    console.error("no stats found on : ", unit);
    setStatsVisible(false);
    return null;
  }
  return (
    <Paper sx={{ height: "fit-content" }}>
      <div className="content">
        <button className="close-button" onClick={() => setStatsVisible(false)}>
          X
        </button>
        <div className="stats">
          <p>{unit.name} Stats</p>
          {unit.category && (
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
            <p>Attaque : </p>
            {isGameMaster && (
              <input
                value={statsEdit.attack}
                onChange={(e) =>
                  setStatsEdit({
                    ...statsEdit,
                    attack: Number(e.target.value),
                  })
                }
                type="number"
              />
            )}
            {statsEdit?.attack && getDices(statsEdit.attack)}
          </div>
          <div className="statElem">
            <p>Défense : </p>
            {isGameMaster && (
              <input
                value={statsEdit.defense}
                onChange={(e) =>
                  setStatsEdit({
                    ...statsEdit,
                    defense: Number(e.target.value),
                  })
                }
                type="number"
              />
            )}
            {statsEdit.defense && getDices(statsEdit.defense)}
          </div>
          <div className="statElem">
            <p>Points d&apos;esprit : </p>
            {isGameMaster && (
              <input
                value={statsEdit.spirit}
                onChange={(e) =>
                  setStatsEdit({
                    ...statsEdit,
                    spirit: Number(e.target.value),
                  })
                }
                type="number"
              />
            )}
            {!isGameMaster && statsEdit.spirit}
          </div>
          <div className="statElem">
            <p>Déplacements : </p>

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
            {statsEdit.movements && getRedDices(statsEdit.movements)}
          </div>
          {statsEdit?.health && statsEdit.maxHealth && (
            <Box
              sx={{
                width: "100%",
                borderRadius: "5px",
                height: "fit-content",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 1,
              }}
            >
              <LinearProgress
                sx={{ minWidth: "70%", borderRadius: "5px", height: "25px" }}
                color="error"
                variant="determinate"
                value={(statsEdit?.health / statsEdit?.maxHealth) * 100}
              />
              <p className="statValue" style={{ minWidth: "30%" }}>
                {`${statsEdit?.health} / ${statsEdit?.maxHealth} HP`}
              </p>
            </Box>
          )}
          {isGameMaster && (
            <div className="statElem">
              <p>HP : </p>
              <input
                value={statsEdit.health}
                onChange={(e) =>
                  setStatsEdit({
                    ...statsEdit,
                    health: Number(e.target.value),
                  })
                }
                type="number"
              />
            </div>
          )}
          {isGameMaster && (
            <div className="statElem">
              <p>Max HP : </p>
              <input
                className="statElem"
                value={statsEdit.maxHealth}
                onChange={(e) =>
                  setStatsEdit({
                    ...statsEdit,
                    maxHealth: Number(e.target.value),
                  })
                }
                type="number"
              />
            </div>
          )}
          <div className="statElem">
            <p>Effets : </p>
            <ul>
              {statsEdit.effects.length > 0 ? (
                statsEdit.effects.map((effect, index) => (
                  <li key={index}>
                    {effect}
                    {isGameMaster && (
                      <button
                        className="warning-button"
                        onClick={() => {
                          const newEffects = statsEdit.effects?.filter(
                            (statusEffect) => statusEffect !== effect,
                          );
                          setStatsEdit({
                            ...statsEdit,
                            effects: newEffects,
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
              <input type="text" placeholder="Nom de l'effet" id="effectName" />
              <button
                className="classic-button"
                onClick={() => {
                  const effectNameInput = document.getElementById(
                    "effectName",
                  ) as HTMLInputElement;
                  const effectName = effectNameInput.value;
                  if (effectName.trim() === "") return;
                  const newEffect = {
                    effectName,
                    duration: "donné par le MJ",
                    relatedSpell: "N/A",
                  };
                  setStatsEdit({
                    ...statsEdit,
                    effects: [
                      ...(statsEdit.effects || []),
                      newEffect.effectName,
                    ],
                  });
                  effectNameInput.value = "";
                }}
              >
                Ajouter effet
              </button>
            </div>
          )}
          {isGameMaster && (
            <button
              className="positive-button"
              onClick={() => sendNewStats(statsEdit)}
            >
              Save Stats
            </button>
          )}
        </div>
      </div>
    </Paper>
  );
  function sendNewStats(newStats: StatsAsJson) {
    // Send the new stats to the server or update the state
    socket.emit(
      "update-stats-unit",
      { gameId, newStats, unitId: unit.id },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          toast.error(
            "Erreur lors de la mise à jour des stats : " + response.error,
          );
        }
      },
    );
  }
};

function getRedDices(numDices: number) {
  const dices = [];
  for (let i = 0; i < numDices; i++) {
    dices.push(
      <div className="dice" key={"red dice number" + i}>
        {getRedDiceFace((i % 6) + 1)}
      </div>,
    );
  }
  return dices;
}

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
      </div>,
    );
  }
  return dices;
}

export default StatsComponent;
