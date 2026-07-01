import { useEffect, useRef } from "react";
import { DiceBox } from "./dice";

interface DiceRollerProps {
  rollData: { listResults: number[]; role: string } | null;
}

export const ThreeDRedDiceRoller = ({ rollData }: DiceRollerProps) => {
  const diceBoxRef = useRef<DiceBox | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rollDataRef = useRef<{
    listResults: number[];
    role: string;
  } | null>(rollData);

  useEffect(() => {
    rollDataRef.current = rollData;
  }, [rollData]);

  // Création de la DiceBox une seule fois au montage
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      diceBoxRef.current = new DiceBox(containerRef.current, {
        diceScaleFactor: 0.7,
        boxScale: 1,
        diceLabels: [
          " ",
          "assets/dice/redDiceFaces/redDice1.png",
          "assets/dice/redDiceFaces/redDice2.png",
          "assets/dice/redDiceFaces/redDice3.png",
          "assets/dice/redDiceFaces/redDice4.png",
          "assets/dice/redDiceFaces/redDice5.png",
          "assets/dice/redDiceFaces/redDice6.png",
        ],
      });
    }

    if (rollDataRef.current) {
      triggerRoll(diceBoxRef.current!, rollDataRef.current).catch(
        console.error,
      );
    }

    return () => {
      diceBoxRef.current = null;
    };
  }, []);

    useEffect(() => {
      if (rollData && diceBoxRef.current) {
        triggerRoll(diceBoxRef.current, rollData);
      }
    }, [rollData]);

  return (
    <div className="dice-roller">
      <div ref={containerRef} style={{ width: "1200px", height: "800px" }} />
    </div>
  );
};

async function triggerRoll(
  diceBox: DiceBox,
  rollData: { listResults: number[]; role: string },
) {
  diceBox.roll(
    rollData.listResults.length,
    () => {},
    rollData.listResults,
  );
}