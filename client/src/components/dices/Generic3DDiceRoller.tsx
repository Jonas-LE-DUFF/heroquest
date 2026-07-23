import { useEffect, useRef } from "react";
import { DiceBox } from "./dicePhysics";
import { Socket } from "socket.io-client";
import { FightDiceFaces } from "../../POO/enums/Dices/FightDiceFaces";
import { DiceKind, getDiceLabels, RollData } from "./diceHelper";
import { PlayerRole } from "../../POO/enums/PlayerRole";
import { useLocation } from "react-router-dom";
import { GameAsJson } from "../../POO/interfaces/ClassAsJson/Server/GameAsJson";

interface DiceRollerProps<K extends DiceKind> {
  socket: Socket;
  gameId: string;
  rollData: RollData | null;
  setRollData: (data: RollData | null) => void;
  kind: K;
}

export function Generic3DDiceRoller<K extends DiceKind>({
  socket,
  gameId,
  rollData,
  setRollData,
  kind,
}: DiceRollerProps<K>) {
  const location = useLocation().state as {
    playerId: string;
    game: GameAsJson;
  };
  const playerRole = location.game.players.find(
    (p) => p.id === location.playerId,
  )?.role;
  const diceBoxRef = useRef<DiceBox | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const unbindSwipeRef = useRef<(() => void) | null>(null);
  const rollDataRoleRef = useRef<PlayerRole | null>(
    rollData?.role ?? playerRole ?? null,
  );

  useEffect(() => {
    if (rollData?.role === null || rollData?.role === undefined) return;
    rollDataRoleRef.current = rollData.role;
  }, [rollData]);

  // Création de la DiceBox — une seule fois au montage
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    diceBoxRef.current = new DiceBox(containerRef.current, {
      diceScaleFactor: 0.7,
      boxScale: 1,
      diceLabels: getDiceLabels(kind),
    });

    return () => {
      unbindSwipeRef.current?.();
      diceBoxRef.current?.dispose();
      diceBoxRef.current = null;
    };
  }, [kind]);

  // Réagit aux nouveaux rollData (Dialog déjà ouvert)
  useEffect(() => {
    if (rollData && diceBoxRef.current) {
      triggerRoll(diceBoxRef.current, rollData, kind);
      setRollData(null);
    }
  }, [rollData, setRollData, kind]);

  // Gère le mode "swipe requis"
  useEffect(() => {
    if (!diceBoxRef.current) return;

    // Retire un éventuel swipe précédent
    unbindSwipeRef.current?.();

    unbindSwipeRef.current = diceBoxRef.current.bindSwipe((x, y, z, boost) => {
      // Retire le listener dès le premier swipe — un seul lancer possible
      console.log("Swipe reçu, envoi vecteur au serveur:", { x, y, z, boost });
      unbindSwipeRef.current?.();
      unbindSwipeRef.current = null;
      socket.emit(
        "provide-roll-vector",
        { gameId, vector: { x, y, z }, boost },
        (response: { success: boolean; error?: string }) => {
          if (!response.success) {
            console.error("Erreur envoi vecteur:", response.error);
          }
        },
      );
    });

    return () => {
      unbindSwipeRef.current?.();
      unbindSwipeRef.current = null;
    };
  }, [socket, gameId]);

  console.log(
    "Generic3DDiceRoller mounted with props:",
    rollDataRoleRef.current,
  );

  return (
    <div
      className={
        "dice-roller " +
        (rollDataRoleRef.current === PlayerRole.HERO ? "hero" : "game-master")
      }
    >
      <div ref={containerRef} style={{ width: "1200px", height: "800px" }} />
    </div>
  );
}

function triggerRoll(
  diceBox: DiceBox,
  rollData: {
    listResults: number[] | FightDiceFaces[];
    vector: { x: number; y: number; z: number; boost: number };
  },
  kind: DiceKind,
) {
  let results = rollData.listResults;
  if (kind === "fight") {
    results = rollData.listResults.map((face) => {
      switch (face as FightDiceFaces) {
        case FightDiceFaces.Hit:
          return 1;
        case FightDiceFaces.WhiteShield:
          return 5;
        case FightDiceFaces.BlackShield:
          return 6;
        default:
          return 0;
      }
    });
  }
  diceBox.rollWithVector(
    rollData.vector,
    rollData.vector.boost,
    rollData.listResults.length,
    () => {},
    results,
  );
}
