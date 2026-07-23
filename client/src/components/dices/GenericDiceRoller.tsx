import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, Paper } from "@mui/material";
import { Socket } from "socket.io-client";
import { useLocation } from "react-router-dom";
import { LocationState } from "../../POO/types/LocationType";
import { PlayerRole } from "../../POO/enums/PlayerRole";
import { FightDiceFaces } from "../../POO/enums/Dices/FightDiceFaces";
import "./DiceComponentsStyle.css";
import { Generic3DDiceRoller } from "./Generic3DDiceRoller";
import { DiceKind, getDiceFaceImage, RollData } from "./diceHelper";

interface GenericDiceRollerProps<K extends DiceKind> {
  kind: K;
  socket: Socket;
  diceOwner: PlayerRole;
  open?: boolean;
  onClose?: () => void;
  canOpen?: boolean;
}

export function GenericDiceRoller<K extends DiceKind>({
  kind,
  socket,
  diceOwner,
  open: controlledOpen,
  onClose,
  canOpen = true,
}: GenericDiceRollerProps<K>) {
  const state = useLocation().state as LocationState;
  const { playerId, game } = state;
  const playerRole = game.players.find((p) => p.id === playerId)?.role;

  const [currentDiceFaces, setCurrentDiceFaces] = useState<
    number[] | FightDiceFaces[] | null
  >(kind === "red" ? Array.of(1, 1) : Array.of(FightDiceFaces.Hit));

  const [currentNumberOfDices, setCurrentNumberOfDices] = useState<number>(
    kind === "red" ? 2 : 1,
  );
  const [rollData, setRollData] = useState<RollData | null>(null);

  const [internalOpen, setInternalOpen] = useState(false);
  const popupOpenedRef = useRef(false);
  const renderOpen = controlledOpen ?? internalOpen;

  const openPopupOnce = useCallback(() => {
    if (!canOpen || popupOpenedRef.current) return;
    popupOpenedRef.current = true;
    setInternalOpen(true);
  }, [canOpen]);

  const closePopup = useCallback(() => {
    popupOpenedRef.current = false;
    setInternalOpen(false);
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (!canOpen) return;

    const onRequestDiceVector = (data: { typeOfDices: "fight" | "red" }) => {
      if (data.typeOfDices !== kind) return;
      if (playerRole !== diceOwner) return;
      openPopupOnce();
    };

    const onSpecialAuthorization = (data: {
      playerId: string;
      amountOfDices: number;
      typeOfDices: string;
    }) => {
      if (
        data.playerId === playerId &&
        data.typeOfDices === kind &&
        diceOwner === PlayerRole.HERO
      ) {
        console.log("Received special-authorization:", data);
        setCurrentNumberOfDices(data.amountOfDices);
        setCurrentDiceFaces(fillDiceFaces(data.amountOfDices, kind));
      }
    };

    const onDiceUpdate = (data: RollData) => {
      console.log("Received dice-update:", data);
      if (data.role !== diceOwner || kind !== data.kind) return;
      setRollData(data);
      setCurrentNumberOfDices(data.listResults.length);
      openPopupOnce();
    };

    socket.on("dice-update", (data: RollData) => onDiceUpdate(data));
    socket.on("request-dice-vector", onRequestDiceVector);
    socket.on("special-authorization", onSpecialAuthorization);

    return () => {
      socket.off("dice-update", (data: RollData) => onDiceUpdate(data));
      socket.off("request-dice-vector", onRequestDiceVector);
      socket.off("special-authorization", onSpecialAuthorization);
    };
  }, [socket, kind, diceOwner, playerRole, canOpen, openPopupOnce, playerId]);

  const isOwner = playerRole === diceOwner;

  const rollDice = () => {
    if (!isOwner) return;
    const eventName = kind === "red" ? "roll-red-dice" : "roll-dice";
    console.log("emitting event:", eventName, {
      gameId: game.id,
      playerId: playerId,
      numberOfDice: currentNumberOfDices,
    });
    socket.emit(
      "roll-dice",
      {
        gameId: game.id,
        playerId: playerId,
        numberOfDice: currentNumberOfDices,
        kind: kind,
      },
      (response: { success: boolean; message?: string }) => {
        if (!response.success) {
          console.error(`Error rolling ${kind} dice: ${response.message}`);
        }
      },
    );
  };

  return (
    <>
      <div className="container">
        <Paper
          className={isOwner ? "dice-container clickable" : "dice-container"}
          sx={{
            display: "flex",
            flexDirection: "row",
          }}
          onClick={isOwner ? rollDice : undefined}
        >
          {renderDices(currentDiceFaces, kind)}
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
      <Dialog
        className="dice-dialog"
        open={renderOpen}
        onClose={closePopup}
        sx={{
          "& .MuiDialog-paper": {
            width: "1200px",
            maxWidth: "1200px",
            height: "800px",
            maxHeight: "800px",
          },
        }}
      >
        <Generic3DDiceRoller<K>
          kind={kind}
          socket={socket}
          gameId={game.id}
          rollData={rollData}
          setRollData={setRollData}
          setCurrentDiceFaces={setCurrentDiceFaces}
        />
      </Dialog>
    </>
  );
}

function renderDices(
  currentDiceFaces: number[] | FightDiceFaces[] | null | undefined,
  diceKind: DiceKind,
) {
  if (!currentDiceFaces) return null;
  return currentDiceFaces?.map((face, i) => (
    <div key={i} className="dice">
      {face !== null ? (
        <img
          className="img-dice"
          src={getDiceFaceImage(face, diceKind)}
          alt={`Dice face ${face}`}
        />
      ) : null}
    </div>
  ));
}

function fillDiceFaces(
  amount: number,
  diceKind: DiceKind,
): (number | FightDiceFaces)[] {
  const diceFaces: (number | FightDiceFaces)[] = [];
  if (diceKind === "red") {
    for (let i = 0; i < amount; i++) {
      diceFaces[i] = (i % 6) + 1; // Default face for red dice
    }
  } else if (diceKind === "fight") {
    for (let i = 0; i < amount; i++) {
      diceFaces[i] = i % 3; // Default face for fight dice (0, 1, 2)
    }
  }

  return diceFaces;
}
