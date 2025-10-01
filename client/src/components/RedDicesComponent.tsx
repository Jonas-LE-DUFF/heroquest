import React, { useState, useEffect } from "react";
import { diceFace } from "../shared/type";
import { Paper } from "@mui/material";
import "./HeroQuestDicesComponent.css";
import face1 from "./images/redDice1.png";
import face2 from "./images/redDice2.png";
import face3 from "./images/redDice3.png";
import face4 from "./images/redDice4.png";
import face5 from "./images/redDice5.png";
import face6 from "./images/redDice6.png";

interface RedDicesProps {
  socket: any;
  gameId: string;
}

const RedDices = ({ socket, gameId }: RedDicesProps) => {
  const [currentDiceFaces, setCurrentDiceFaces] = useState<number[] | null>(
    Array.of(1, 1)
  );

  useEffect(() => {
    socket.on("red-dice-update", (data: { listResults: number[] }) => {
      setCurrentDiceFaces(data.listResults);
    });

    return () => {
      socket.off("red-dice-update");
    };
  }, [socket]);

  const rollDice = () => {
    socket.emit("roll-red-dice", {
      gameId,
    });
  };

  function getDiceFace(face: number) {
    switch (face) {
      case 1:
        return <img src={face1} alt="dé rouge face 1" />;
      case 2:
        return <img src={face2} alt="dé rouge face 2" />;
      case 3:
        return <img src={face3} alt="dé rouge face 3" />;
      case 4:
        return <img src={face4} alt="dé rouge face 4" />;
      case 5:
        return <img src={face5} alt="dé rouge face 5" />;
      case 6:
        return <img src={face6} alt="dé rouge face 6" />;
      default:
        return null;
    }
  }

  function renderDices(currentDiceFaces: Array<number> | null) {
    if (currentDiceFaces === null) {
      console.log("no dice faces given");
      return;
    }
    const dices = [];
    for (let i = 0; i < 2; i++) {
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
        {renderDices(currentDiceFaces)}
      </Paper>
      <button onClick={rollDice}>lancer les dés rouges</button>
    </div>
  );
};

export default RedDices;
