import React, { useState, useEffect } from "react";
import { diceFace } from "../shared/type";
import { Paper } from "@mui/material";
import "./HeroQuestDicesComponent.css";
import { getFightDiceFace } from "../shared/utils";

interface DicesProps {
  socket: any;
  gameId: string;
  role: "hero" | "game-master";
}

const Dices = ({ socket, gameId, role }: DicesProps) => {
  const [currentDiceFaces, setCurrentDiceFaces] = useState<diceFace[] | null>(
    Array.of(diceFace.Hit)
  );
  const [currentNumberOfDices, setCurrentNumberOfDices] = useState<number>(1);

  useEffect(() => {
    socket.on(
      "dice-update",
      (data: { listResults: diceFace[]; role: "hero" | "game-master" }) => {
        if (data.role !== role) return; // updates is not for us
        for (let result of data.listResults) {
          console.log("result : ", result);
        }

        console.log("liste des résultats : " + data.listResults);
        setCurrentDiceFaces(data.listResults);
      }
    );

    return () => {
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
          {currentDiceFaces[i] !== null ? (
            <img src={getFightDiceFace(currentDiceFaces[i])} alt={` `} />
          ) : (
            "noFace"
          )}
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
