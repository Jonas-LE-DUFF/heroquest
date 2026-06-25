import { Box, LinearProgress, Paper } from "@mui/material";
import "./StatsComponent.css";
import {
  getFightDiceFaceNumber,
  getIconClassPath,
  getUnitClassName,
  isHero,
} from "../../shared/utils";
import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { MonsterAsJson } from "../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { StatsAsJson } from "../../POO/interfaces/ClassAsJson/Unit/StatsAsJson";
import { toast } from "react-toastify";
import { getRedDiceFace } from "../dices/RedDicesComponent";
import { useLocation } from "react-router-dom";
import { LocationState } from "../../POO/types/LocationType";
import { PlayerRole } from "../../POO/enums/PlayerRole";

interface StatsComponentProps {
  socket: Socket;
  unit: MonsterAsJson | HeroAsJson;
  setStatsVisible: (arg0: boolean) => void;
}

const StatsComponent = ({
  socket,
  unit,
  setStatsVisible,
}: StatsComponentProps) => {
  const state = useLocation().state as LocationState;
  const { playerId, game } = state;

  const isGameMaster =
    game.players.find((p) => p.id === playerId)?.role ===
    PlayerRole.GAME_MASTER;

  const [statsEdit, setStatsEdit] = useState<StatsAsJson>(unit.stats);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setStatsEdit(unit.stats);
  }, [unit.stats]);

  if (!unit?.stats) {
    console.error("no stats found on : ", unit);
    setStatsVisible(false);
    return null;
  }
  return (
    <Paper
      sx={{
        width: "min(720px, calc(100vw - 32px))",
        maxHeight: "calc(100vh - 32px)",
        overflow: "hidden",
        borderRadius: "16px",
      }}
    >
      <div className="content">
        <h3>Caractéristiques</h3>
        <hr />
        <div className="stats">
          <p>Nom : {unit.name}</p>
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
            {isGameMaster && isEditing && (
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
            {statsEdit?.attack && !isEditing && getDices(statsEdit.attack)}
          </div>
          <div className="statElem">
            <p>Défense : </p>
            {isGameMaster && isEditing && (
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
            {statsEdit.defense && !isEditing && getDices(statsEdit.defense)}
          </div>
          <div className="statElem">
            <p>Points d&apos;esprit : </p>
            {isGameMaster && isEditing && (
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
            {!isEditing && statsEdit.spirit}
          </div>
          <div className="statElem">
            <p>Déplacements : </p>

            {isGameMaster && isEditing && (
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
            {statsEdit.movements &&
              !isEditing &&
              (isHero(unit)
                ? getRedDices(statsEdit.movements)
                : statsEdit.movements)}
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
          {isGameMaster && isEditing && (
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
          {isGameMaster && isEditing && (
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
                    {isGameMaster && isEditing && (
                      <button
                        className="warning-button remove-effect-button"
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
          {isGameMaster && isEditing && (
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
          {isGameMaster && isEditing && (
            <button
              className="positive-button"
              onClick={() => {
                sendNewStats(statsEdit);
                setIsEditing(false);
              }}
            >
              Save Stats
            </button>
          )}
          {isGameMaster && !isEditing && (
            <button
              className="classic-button"
              onClick={() => setIsEditing(true)}
            >
              Modifier les stats
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
      { gameId: game.id, playerId, newStats, unitId: unit.id },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          toast.error(
            "Erreur lors de la mise à jour des stats : " + response.error,
          );
          if (statsEdit !== unit.stats) {
            toast.info(
              "Les stats ont été réinitialisées aux valeurs précédentes.",
            );
            setStatsEdit(unit.stats);
          }
          return;
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
