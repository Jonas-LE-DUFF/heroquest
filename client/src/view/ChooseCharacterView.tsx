import React, { useState, useEffect, ChangeEvent } from "react";
import { useLocation } from "react-router-dom";
import "./GamePageView.css";
import { heroClass } from "../shared/type";
import {
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import { getHeroClassIconPath } from "../shared/utils";
import "./ChooseCharacterView.css";

interface ChooseCharacterProps {
  socket: any;
}

const ChooseCharacter: React.FC<ChooseCharacterProps> = ({ socket }) => {
  const location = useLocation();
  const gameState = location.state.gameState;
  const { playerName, gameId, role } = location.state;
  const [heroType, setHeroType] = useState<heroClass>(heroClass.Barbarian);
  const [formErrors, setFormErrors] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!gameState) return;

    return () => {};
  }, [socket, gameState]);

  function renderMenuItems() {
    return Object.entries(heroClass)
      .filter(([key, value]) => isNaN(Number(key)))
      .map(([key, value]) => (
        <MenuItem key={value} value={value}>
          <div className="selectHeroClass">
            <img
              src={getHeroClassIconPath(value as heroClass)}
              alt={"icon" + value}
            ></img>
            {key}
          </div>
        </MenuItem>
      ));
  }

  const handleChangeHeroClass = (event: SelectChangeEvent<number>) => {
    setHeroType(Number(event.target.value));
  };

  const handleTextFieldNumber = (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    const value = event.target.value;
    const numericValue = Number(value);

    const isValid =
      value === "" ||
      (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 10);

    setFormErrors((prev) => ({
      ...prev,
      [fieldName]: !isValid,
    }));

    if (isValid && value !== "") {
      console.log(`${fieldName}:`, numericValue);
    }
  };

  return (
    <div className="character-page">
      <h1>Choisissez votre personnage</h1>
      <FormControl fullWidth>
        <div className="form">
          <div className="formElement">
            <label id="label-hero-class">classe : </label>
            <Select
              labelId="label-hero-class"
              id="select-hero-class"
              value={heroType}
              onChange={handleChangeHeroClass}
              autoWidth
            >
              {renderMenuItems()}
            </Select>
          </div>
          <div className="formElement">
            <label id="label-attack-dice">dés en attaque</label>
            <TextField
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleTextFieldNumber(e, "attackDice")
              }
              error={formErrors.attackDice}
              helperText={
                formErrors.attackDice ? "Doit être un nombre entre 0 et 10" : ""
              }
            />
          </div>
          <div className="formElement">
            <label id="label-defense-dice">dés en défence</label>
            <TextField
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleTextFieldNumber(e, "defenseDice")
              }
              error={formErrors.defenseDice}
              helperText={
                formErrors.defenseDice
                  ? "Doit être un nombre entre 0 et 10"
                  : ""
              }
            />
          </div>
          <div className="formElement">
            <label id="label-hp">points de vie</label>
            <TextField
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleTextFieldNumber(e, "hp")
              }
              error={formErrors.hp}
              helperText={
                formErrors.hp ? "Doit être un nombre entre 0 et 10" : ""
              }
            />
          </div>
          <div className="formElement">
            <label id="label-sp">points d'esprit</label>
            <TextField
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleTextFieldNumber(e, "sp")
              }
              error={formErrors.sp}
              helperText={
                formErrors.sp ? "Doit être un nombre entre 0 et 10" : ""
              }
            />
          </div>
          <div className="formElement">
            <label id="label">pièces d'or</label>
            <TextField
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleTextFieldNumber(e, "gold")
              }
              error={formErrors.gold}
              helperText={
                formErrors.gold ? "Doit être un nombre entre 0 et 10" : ""
              }
            />
          </div>
        </div>
      </FormControl>
    </div>
  );
};

export default ChooseCharacter;
