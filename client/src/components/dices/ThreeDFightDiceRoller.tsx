import { useEffect, useRef } from "react";
import { DiceBox } from "./dice";
import { FightDiceFaces } from "../../POO/enums/Dices/FightDiceFaces";

interface DiceRollerProps {
  rollData: { listResults: FightDiceFaces[]; role: string } | null;
}

export const ThreeDFightDiceRoller = ({ rollData }: DiceRollerProps) => {
  const diceBoxRef = useRef<DiceBox | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rollDataRef = useRef<{
    listResults: FightDiceFaces[];
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
          "assets/dice/fightDiceFaces/death.png",
          "assets/dice/fightDiceFaces/death.png",
          "assets/dice/fightDiceFaces/death.png",
          "assets/dice/fightDiceFaces/whiteShield.png",
          "assets/dice/fightDiceFaces/whiteShield.png",
          "assets/dice/fightDiceFaces/blackShield.png",
        ],
      });
    }

    if (rollDataRef.current) {
      triggerRoll(diceBoxRef.current!, rollDataRef.current);
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

function triggerRoll(
  diceBox: DiceBox,
  rollData: { listResults: FightDiceFaces[] },
) {
  const rollResult = rollData.listResults.map((face) => {
    switch (face) {
      case FightDiceFaces.Hit:
        return 1; // Hit
      case FightDiceFaces.WhiteShield:
        return 4; // White Shield
      case FightDiceFaces.BlackShield:
        return 6; // Black Shield
      default:
        return 1; // Default to Hit if unknown face
    }
  });
  diceBox.roll(rollData.listResults.length, () => {}, rollResult);
}
