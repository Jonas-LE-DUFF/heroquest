import React, { useState, useEffect } from "react";
import { diceFace } from "../shared/type";
import { Paper } from "@mui/material";
import deFaceNoir from "./images/deFaceNoir.jpeg";
import deFaceBlanche from "./images/deFaceBlanche.jpeg";
import deFaceMort from "./images/deFaceMort.jpeg";
import "./DicesComponent.css";

interface DicesProps {
  socket: any;
  gameId: string;
}

const Dices = ({ socket, gameId }: DicesProps) => {
  const [currentDiceFaces, setCurrentDiceFaces] = useState<diceFace[] | null>(
    Array.of(diceFace.Hit)
  );
  const [currentNumberOfDices, setCurrentNumberOfDices] = useState<number>(1);

  useEffect(() => {
    socket.on("dice-update", (data: { listResults: diceFace[] }) => {
      for (let result of data.listResults) {
        console.log("result : ", result);
      }

      console.log("liste des résultats : " + data.listResults);
      setCurrentDiceFaces(data.listResults);
    });

    return () => {
      socket.off("game-state-update");
      socket.off("dice-update");
    };
  }, [socket]);

  const rollDice = () => {
    socket.emit("roll-dice", {
      gameId,
      playerId: socket.id,
      numberOfDice: currentNumberOfDices,
    });
  };

  function getDiceFace(face: diceFace) {
    if (face === diceFace.BlackShield)
      return <img src={deFaceNoir} alt="dé face noir" />;
    if (face === diceFace.WhiteShield)
      return <img src={deFaceBlanche} alt="dé face blanche" />;
    if (face === diceFace.Hit)
      return <img src={deFaceMort} alt="dé face mort" />;
  }

  function renderDices(
    currentDiceFaces: Array<diceFace> | null,
    currentNumberOfDices: number
  ) {
    if (currentDiceFaces === null) {
      console.log("no dice faces given");
      return;
    }
    const dices = [];
    for (let i = 0; i < currentNumberOfDices; i++) {
      dices.push(
        <div className="dice" key={"dice number" + i}>
          {currentDiceFaces[i] !== null
            ? getDiceFace(currentDiceFaces[i])
            : "noFace"}
        </div>
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
        {renderDices(currentDiceFaces, currentNumberOfDices)}
      </Paper>
      <button onClick={rollDice}>lancer les dés</button>
      <input
        type="number"
        onChange={(e) => setCurrentNumberOfDices(Number(e.currentTarget.value))}
      />
    </div>
  );
};

export default Dices;
