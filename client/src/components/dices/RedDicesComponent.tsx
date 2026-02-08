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

interface RedDicesProps {
  socket: any;
  gameId: string;
  role: PlayerRole;
  viewerRole: PlayerRole;
}

const RedDices = ({ socket, gameId, role, viewerRole }: RedDicesProps) => {
  const [currentDiceFaces, setCurrentDiceFaces] = useState<number[] | null>(
    Array.of(1, 1),
  );
  const [currentNumberOfDices, setCurrentNumberOfDices] = useState<number>(2);
  const playerRole = viewerRole;

  useEffect(() => {
    setCurrentDiceFaces(Array.of(...Array(currentNumberOfDices).fill(1)));
  }, [currentNumberOfDices]);

  useEffect(() => {
    const onRedDiceUpdate = (data: {
      listResults: number[];
      role: PlayerRole;
    }) => {
      if (data.role !== role) return; // update not for us
      setCurrentDiceFaces(data.listResults);
    };

    const onSpecialAuthorization = (data: {
      playerId: string;
      amountOfDices: number;
      typeOfDices: string;
    }) => {
      console.log("special auth", data);

      if (
        data.playerId === socket.id &&
        data.typeOfDices === "red" &&
        role === PlayerRole.HERO
      ) {
        setCurrentDiceFaces(Array.of(...Array(data.amountOfDices).fill(1)));
      }
    };

    socket.on("red-dice-update", onRedDiceUpdate);
    socket.on("special-authorization", onSpecialAuthorization);

    return () => {
      socket.off("red-dice-update", onRedDiceUpdate);
      socket.off("special-authorization", onSpecialAuthorization);
    };
  }, [socket, role, currentDiceFaces]);

  const rollDice = () => {
    socket.emit(
      "roll-red-dice",
      {
        gameId,
        currentNumberOfDices,
      },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          alert("Erreur lors du lancement des dés rouges : " + response.error);
        }
      },
    );
  };

  function getDiceFace(face: number) {
    switch (face) {
      case 1:
        return <img className="imgDice" src={face1} alt="dé rouge face 1" />;
      case 2:
        return <img className="imgDice" src={face2} alt="dé rouge face 2" />;
      case 3:
        return <img className="imgDice" src={face3} alt="dé rouge face 3" />;
      case 4:
        return <img className="imgDice" src={face4} alt="dé rouge face 4" />;
      case 5:
        return <img className="imgDice" src={face5} alt="dé rouge face 5" />;
      case 6:
        return <img className="imgDice" src={face6} alt="dé rouge face 6" />;
      default:
        return null;
    }
  }

  function renderDices(currentDiceFaces: Array<number> | null) {
    if (currentDiceFaces === null) {
      return;
    }
    const dices = [];
    for (let i = 0; i < currentDiceFaces.length; i++) {
      dices.push(
        <div className="dice" key={"dice number" + i}>
          {currentDiceFaces[i] !== null
            ? getDiceFace(currentDiceFaces[i])
            : "noFace"}
        </div>,
      );
    }
    return dices;
  }

  return (
    <div className="container">
      <Paper
        className="dice-container"
        sx={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        {renderDices(currentDiceFaces)}
      </Paper>
      {playerRole === role && (
        <button onClick={rollDice}>lancer les dés rouges</button>
      )}
      {playerRole === PlayerRole.GAME_MASTER &&
        role === PlayerRole.GAME_MASTER && (
          <input
            className="inputDice"
            type="number"
            onChange={(e) =>
              setCurrentNumberOfDices(Number(e.currentTarget.value))
            }
          />
        )}
    </div>
  );
};

export default RedDices;
