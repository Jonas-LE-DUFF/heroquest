import { useState, useEffect } from "react";
import { diceFace } from "../../shared/type";
import { Paper } from "@mui/material";
import "./HeroQuestDicesComponent.css";
import { getFightDiceFace } from "../../shared/utils";

interface DicesProps {
  socket: any;
  gameId: string;
  role: "hero" | "game-master"; //the role to whom this dices belong
  viewerRole: "hero" | "game-master"; //who is watching the dices
}

const Dices = ({ socket, gameId, role, viewerRole }: DicesProps) => {
  const [currentDiceFaces, setCurrentDiceFaces] = useState<diceFace[] | null>(
    Array.of(diceFace.Hit)
  );
  const [currentNumberOfDices, setCurrentNumberOfDices] = useState<number>(1);
  const playerRole = viewerRole;

  useEffect(() => {
    const fillDiceFaces = (numberOfDices: number) => {
      setCurrentDiceFaces((prev) => {
        const faceList = prev ? [...prev] : [];
        for (let i = 0; i < numberOfDices; i++) {
          if (faceList[i] === undefined) faceList[i] = diceFace.Hit;
        }
        return faceList;
      });
    };

    const onDiceUpdate = (data: {
      listResults: diceFace[];
      role: "hero" | "game-master";
    }) => {
      if (data.role !== role) return; // update is not for this component
      setCurrentNumberOfDices(data.listResults.length);
      setCurrentDiceFaces(data.listResults);
    };

    const onSpecialAuthorization = (data: {
      playerId: string;
      amountOfDices: number;
      typeOfDices: string;
    }) => {
      console.log("special-authorization received :", data);
      if (
        data.playerId === socket.id &&
        data.typeOfDices === "fight" &&
        role === "hero"
      ) {
        setCurrentNumberOfDices(data.amountOfDices);
        fillDiceFaces(data.amountOfDices);
      }
    };

    socket.on("dice-update", onDiceUpdate);
    socket.on("special-authorization", onSpecialAuthorization);

    return () => {
      socket.off("dice-update", onDiceUpdate);
      socket.off("special-authorization", onSpecialAuthorization);
    };
  }, [socket, role]);

  const rollDice = () => {
    socket.emit(
      "roll-dice",
      {
        gameId,
        playerId: socket.id,
        numberOfDice: currentNumberOfDices,
      },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          alert("Erreur lancement des dés de combat : " + response.error);
        }
      }
    );
  };

  function renderDices(
    currentDiceFaces: Array<diceFace> | null,
    currentNumberOfDices: number
  ) {
    if (currentDiceFaces === null) {
      return;
    }
    const dices = [];
    for (let i = 0; i < currentNumberOfDices; i++) {
      dices.push(
        <div className="dice" key={"dice number" + i}>
          {currentDiceFaces[i] !== null ? (
            <img
              className="img"
              src={getFightDiceFace(currentDiceFaces[i])}
              alt={` `}
            />
          ) : (
            "noFace"
          )}
        </div>
      );
    }
    return dices;
  }

  return (
    <div className={"container " + role}>
      <Paper
        className="dice-container"
        sx={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        {renderDices(currentDiceFaces, currentNumberOfDices)}
      </Paper>
      {playerRole === role && (
        <div className="container">
          <button onClick={rollDice}>lancer les dés</button>
          {playerRole === "game-master" && (
            <input
              type="number"
              onChange={(e) =>
                setCurrentNumberOfDices(Number(e.currentTarget.value))
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Dices;
