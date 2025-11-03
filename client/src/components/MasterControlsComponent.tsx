import { useState } from "react";
import { heroClass } from "../shared/type";
import { FormControlLabel, Radio, RadioGroup, Select } from "@mui/material";
import { renderHeroClassOptions } from "../shared/selectHeroClass";
import "./MasterControlsComponent.css";

interface MasterControlsProps {
  socket: any;
  gameId: string;
}

const MasterControls = ({ socket, gameId }: MasterControlsProps) => {
  const [numberOfDices, setNumberOfDices] = useState<number>(1);
  const [heroType, setHeroType] = useState<heroClass>(heroClass.Barbarian);
  const [diceType, setDiceType] = useState<"fight" | "red">("fight");

  const authorizeNumberOfFightDices = () => {
    socket.emit("authorize-special-throw-dices", {
      gameId: gameId,
      numberOfDices: numberOfDices,
      typeOfDices: diceType,
      playerClass: heroType,
    });
  };

  return (
    <div className="container">
      <div className="form-component">
        <p>Nombre de dés à lancer authorisé</p>
        <input
          value={numberOfDices}
          type="number"
          onChange={(e) => setNumberOfDices(Number(e.currentTarget.value))}
        />
      </div>
      <div className="form-component">
        <p>Joueur.se autorisé.e</p>
        <Select
          labelId="label-hero-class"
          id="select-hero-class"
          value={heroType}
          onChange={(e) => setHeroType(e.target.value as heroClass)}
          autoWidth
          sx={{ background: "white" }}
        >
          {renderHeroClassOptions()}
        </Select>
      </div>
      <RadioGroup
        color="white"
        sx={{ color: "white" }}
        value={diceType}
        row
        onChange={(e) => setDiceType(e.target.value as "fight" | "red")}
      >
        <FormControlLabel
          value="fight"
          control={<Radio />}
          label="Dés de combat"
        />
        <FormControlLabel value="red" control={<Radio />} label="Dés rouges" />
      </RadioGroup>
      <button
        onClick={() => {
          authorizeNumberOfFightDices();
        }}
      >
        Autoriser lancer de dés de combat
      </button>
    </div>
  );
};

export default MasterControls;
