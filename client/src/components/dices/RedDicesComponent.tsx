import { useState, useEffect } from "react";
import { Paper } from "@mui/material";
import "./HeroQuestDicesComponent.css";
import face1 from "./../images/redDice1.png";
import face2 from "./../images/redDice2.png";
import face3 from "./../images/redDice3.png";
import face4 from "./../images/redDice4.png";
import face5 from "./../images/redDice5.png";
import face6 from "./../images/redDice6.png";
import { PlayerRole } from "../../POO/enums/PlayerRole";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import { useLocation } from "react-router-dom";
import { LocationState } from "../../POO/types/LocationType";

interface RedDicesProps {
  socket: Socket;
  diceOwner: PlayerRole;
}

const RedDices = ({ socket, diceOwner }: RedDicesProps) => {
  const state = useLocation().state as LocationState;
  const { playerId, game } = state;

  const [currentDiceFaces, setCurrentDiceFaces] = useState<number[] | null>(
    Array.of(1, 1),
  );
  const [currentNumberOfDices, setCurrentNumberOfDices] = useState<number>(2);
  const playerRole = game.players.find((p) => p.id === playerId)?.role;

  useEffect(() => {
    setCurrentDiceFaces(
      Array.of(...(Array(currentNumberOfDices).fill(1) as number[])),
    );
  }, [currentNumberOfDices]);

  useEffect(() => {
    const onRedDiceUpdate = (data: {
      listResults: number[];
      role: PlayerRole;
    }) => {
      if (data.role !== diceOwner) return; // update not for us
      setCurrentDiceFaces(data.listResults);
    };

    const onSpecialAuthorization = (data: {
      playerId: string;
      amountOfDices: number;
      typeOfDices: string;
    }) => {
      if (
        data.playerId === socket.id &&
        data.typeOfDices === "red" &&
        diceOwner === PlayerRole.HERO
      ) {
        setCurrentDiceFaces(
          Array.of(...(Array(data.amountOfDices).fill(1) as number[])),
        );
      }
    };

    socket.on("red-dice-update", onRedDiceUpdate);
    socket.on("special-authorization", onSpecialAuthorization);

    return () => {
      socket.off("red-dice-update", onRedDiceUpdate);
      socket.off("special-authorization", onSpecialAuthorization);
    };
  }, [socket, diceOwner, currentDiceFaces]);

  const rollDice = () => {
    socket.emit(
      "roll-red-dice",
      {
        gameId: game.id,
        playerId: playerId,
        numberOfDice: currentNumberOfDices,
      },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          toast.error(
            "Erreur lors du lancement des dés rouges : " + response.error,
          );
        }
      },
    );
  };

  function renderDices(currentDiceFaces: Array<number> | null) {
    if (currentDiceFaces === null) {
      return;
    }
    const dices = [];
    for (let i = 0; i < currentDiceFaces.length; i++) {
      dices.push(
        <div className="dice" key={"dice number" + i}>
          {currentDiceFaces[i] !== null
            ? getRedDiceFace(currentDiceFaces[i])
            : "noFace"}
        </div>,
      );
    }
    return dices;
  }

  const isOwner = playerRole === diceOwner;

  return (
    <div className="container">
      <Paper
        className={isOwner ? "dice-container clickable" : "dice-container"}
        sx={{
          display: "flex",
          flexDirection: "row",
        }}
        onClick={isOwner ? rollDice : undefined}
      >
        {renderDices(currentDiceFaces)}
      </Paper>
      {playerRole === PlayerRole.GAME_MASTER &&
        diceOwner === PlayerRole.GAME_MASTER && (
          <input
            className="inputDice"
            type="number"
            value={currentNumberOfDices}
            onChange={(e) =>
              setCurrentNumberOfDices(Number(e.currentTarget.value))
            }
          />
        )}
    </div>
  );
};

export function getRedDiceFace(face: number) {
  switch (face) {
    case 1:
      return <img className="img-dice" src={face1} alt="dé rouge face 1" />;
    case 2:
      return <img className="img-dice" src={face2} alt="dé rouge face 2" />;
    case 3:
      return <img className="img-dice" src={face3} alt="dé rouge face 3" />;
    case 4:
      return <img className="img-dice" src={face4} alt="dé rouge face 4" />;
    case 5:
      return <img className="img-dice" src={face5} alt="dé rouge face 5" />;
    case 6:
      return <img className="img-dice" src={face6} alt="dé rouge face 6" />;
    default:
      return null;
  }
}

export default RedDices;
