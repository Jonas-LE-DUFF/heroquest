import { useState } from "react";
import { FormControlLabel, Radio, RadioGroup, Select } from "@mui/material";
import { renderHeroClassOptions } from "../../shared/selectHeroClass";
import "./MasterControlsComponent.css";
import { HeroCategory } from "../../POO/enums/Categories/HeroCategory";
import { Socket } from "socket.io-client";
import { useLocation } from "react-router-dom";
import { LocationState } from "../../POO/types/LocationType";

interface MasterControlsProps {
  socket: Socket;
}

const MasterControls = ({ socket }: MasterControlsProps) => {
  const locationState = useLocation().state as LocationState;
  const { playerId, game } = locationState;

  const [numberOfDices, setNumberOfDices] = useState<number>(1);
  const [heroType, setHeroType] = useState<HeroCategory>(HeroCategory.Barbarian);
  const [diceType, setDiceType] = useState<"fight" | "red">("fight");

  const authorizeNumberOfFightDices = () => {
    socket.emit("authorize-special-throw-dices", {
      gameId: game.id,
      playerId,
      numberOfDices: numberOfDices,
      typeOfDices: diceType,
      playerClass: heroType,
    });
  };

  return (
    <div className="container">
      <div className="form-component">
        <p>Nombre de dés</p>
        <input
          value={numberOfDices}
          type="number"
          onChange={(e) => setNumberOfDices(Number(e.currentTarget.value))}
        />
      </div>
      <div className="form-component">
        <p>Héros</p>
        <Select
          labelId="label-hero-class"
          id="select-hero-class"
          value={heroType}
          onChange={(e) => setHeroType(e.target.value as HeroCategory)}
          autoWidth
          sx={{ background: "white" }}
        >
          {renderHeroClassOptions()}
        </Select>
      </div>
      <RadioGroup
        value={diceType}
        row
        onChange={(e) => setDiceType(e.target.value as "fight" | "red")}
      >
        <FormControlLabel
          sx={{ color: "white" }}
          value="fight"
          control={<Radio />}
          label="Dés de combat"
        />
        <FormControlLabel
          sx={{ color: "white" }}
          value="red"
          control={<Radio />}
          label="Dés rouges"
        />
      </RadioGroup>
      <button
        className="classic-button"
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
