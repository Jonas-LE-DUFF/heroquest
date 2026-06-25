import { useState, useEffect } from "react";
import { Paper } from "@mui/material";
import "./HeroQuestDicesComponent.css";
import { getFightDiceFace } from "../../shared/utils";
import { FightDiceFaces } from "../../POO/enums/Dices/FightDiceFaces";
import { PlayerRole } from "../../POO/enums/PlayerRole";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import { LocationState } from "../../POO/types/LocationType";
import { useLocation } from "react-router-dom";

interface DicesProps {
  socket: Socket;
  diceOwner: PlayerRole; //the role to whom this dices belong
}

const Dices = ({ socket, diceOwner }: DicesProps) => {
  const state = useLocation().state as LocationState;
  const { playerId, game } = state;
  const [currentDiceFaces, setCurrentDiceFaces] = useState<
    FightDiceFaces[] | null
  >(Array.of(FightDiceFaces.Hit));
  const [currentNumberOfDices, setCurrentNumberOfDices] = useState<number>(1);
  const playerRole = game.players.find((p) => p.id === playerId)?.role;
  
  function fillDiceFaces(numberOfDices: number) {
    const PosssibleFaces = [FightDiceFaces.Hit, FightDiceFaces.BlackShield, FightDiceFaces.WhiteShield];
    setCurrentDiceFaces((prev) => {
      const faceList = prev ? [...prev] : [];
      for (let i = 0; i < numberOfDices; i++) {
        if (faceList[i] === undefined) faceList[i] = PosssibleFaces[i % 3];
      }
      return faceList;
    });
  }

  useEffect(() => {

    const onDiceUpdate = (data: {
      listResults: FightDiceFaces[];
      role: PlayerRole;
    }) => {
      if (data.role !== diceOwner) return; // update is not for this component
      setCurrentNumberOfDices(data.listResults.length);
      setCurrentDiceFaces(data.listResults);
    };

    const onSpecialAuthorization = (data: {
      playerId: string;
      amountOfDices: number;
      typeOfDices: string;
    }) => {
      if (
        data.playerId === socket.id &&
        data.typeOfDices === "fight" &&
        diceOwner === PlayerRole.HERO
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
  }, [socket, diceOwner]);

  const rollDice = () => {
    socket.emit(
      "roll-dice",
      {
        gameId: game.id,
        playerId: playerId,
        numberOfDice: currentNumberOfDices,
      },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          toast.error("Erreur lancement des dés de combat : " + response.error);
        }
      },
    );
  };

  function renderDices(
    currentDiceFaces: Array<FightDiceFaces> | null,
    currentNumberOfDices: number,
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
              className="img-dice"
              src={getFightDiceFace(currentDiceFaces[i])}
              alt={` `}
            />
          ) : (
            "noFace"
          )}
        </div>,
      );
    }
    return dices;
  }

  const isOwner = playerRole === diceOwner;

  return (
    <div className={"container"}>
      <Paper
        className={isOwner ? "dice-container clickable" : "dice-container"}
        sx={{
          display: "flex",
          flexDirection: "row",
        }}
        onClick={isOwner ? rollDice : undefined}
      >
        {renderDices(currentDiceFaces, currentNumberOfDices)}
      </Paper>
      {playerRole === PlayerRole.GAME_MASTER &&
        diceOwner === PlayerRole.GAME_MASTER && (
          <input
            className="inputDice"
            type="number"
            value={currentNumberOfDices}
            onChange={(e) => {
              setCurrentNumberOfDices(Number(e.currentTarget.value));
              fillDiceFaces(Number(e.currentTarget.value));
            }}
          />
        )}
    </div>
  );
};

export default Dices;