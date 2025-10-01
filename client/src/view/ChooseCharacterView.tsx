import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./GamePageView.css";
import { heroClass } from "../shared/type";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

interface ChooseCharacterProps {
  socket: any;
}

const ChooseCharacter: React.FC<ChooseCharacterProps> = ({ socket }) => {
  const location = useLocation();
  const gameState = location.state.gameState;

  const [heroType, setHeroType] = useState<heroClass>(heroClass.Barbarian);

  useEffect(() => {
    if (!gameState) return;

    return () => {};
  }, [socket, gameState]);

  function renderMenuItems() {
    const rendering = [];
    for (let elem in heroClass) {
      rendering.push(<MenuItem value={elem}>elem</MenuItem>);
    }
    return rendering;
  }

  return (
    <div className="character page">
      <h1>Choisissez votre personnage</h1>
      <FormControl fullWidth>
        <InputLabel id="label-hero-class">classe</InputLabel>
        <Select
          labelId="label-hero-class"
          id="select-hero-class"
          value={heroType}
          label="classe"
        >
          {renderMenuItems()}
        </Select>
      </FormControl>
    </div>
  );
};

export default ChooseCharacter;
