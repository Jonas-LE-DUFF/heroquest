import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GamePageView.css";
import { heroClass, spellElement, Player } from "../shared/type";
import {
  FormControlLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Checkbox,
} from "@mui/material";
import { getHeroClassIconPath } from "../shared/utils";
import "./ChooseCharacterView.css";

interface ChooseCharacterProps {
  socket: any;
}

const ChooseCharacter: React.FC<ChooseCharacterProps> = ({ socket }) => {
  const navigate = useNavigate();
  const location = useLocation();
  console.log("location hero choice", location);

  const gameState = location.state?.gameState || null;
  const { playerName, gameId, role } = location.state || {};

  const [heroType, setHeroType] = useState<heroClass>(getAvailableClasses()[0]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: boolean }>({});
  const [selectedSpellElements, setSelectedSpellElements] = useState<
    spellElement[]
  >([]);

  function getSelectedClasses() {
    return new Set(
      Array.from(gameState.players.values()).map(
        (player) => (player as Player).class
      )
    );
  }

  function getAvailableClasses() {
    const selectedClasses = getSelectedClasses();
    const allClasses = Object.values(heroClass).filter(
      (value) => typeof value === "number"
    ) as number[];
    return allClasses.filter((cls) => !selectedClasses.has(cls));
  }

  function renderMenuItems() {
    const selectedClasses = getSelectedClasses();

    return Object.entries(heroClass)
      .filter(([key, value]) => isNaN(Number(key)))
      .map(([key, value]) => (
        <MenuItem
          key={value}
          value={value}
          disabled={selectedClasses.has(value as heroClass)}
        >
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

  const handleSpellElementChange = (element: spellElement) => {
    console.log("setting");
    if (heroType === heroClass.Elf) {
      if (selectedSpellElements.includes(element)) {
        // Deselect if already selected
        setSelectedSpellElements([]);
        return;
      }
      // Allow only one selection for Elf
      setSelectedSpellElements([element]);
    } else if (heroType === heroClass.Cleric) {
      console.log("setting cleric", element);
      console.log(selectedSpellElements);

      // Toggle selection for Cleric
      setSelectedSpellElements((prev) => {
        if (prev.includes(element)) {
          return prev.filter((el) => el !== element);
        } else {
          return [...prev, element];
        }
      });
      console.log(selectedSpellElements);
    }
  };

  const isSpellElementDisabled = (element: spellElement) => {
    if (heroType === heroClass.Elf) {
      return (
        selectedSpellElements.length > 0 &&
        !selectedSpellElements.includes(element)
      );
    }
    if (heroType === heroClass.Cleric) {
      return (
        selectedSpellElements.length >= 3 &&
        !selectedSpellElements.includes(element)
      );
    }
    return false;
  };

  const getElementName = (element: spellElement) => {
    return spellElement[element];
  };

  const renderSpellElements = () => {
    if (heroType !== heroClass.Elf && heroType !== heroClass.Cleric) {
      return null;
    }
    const elements: spellElement[] = [];
    for (const e in spellElement) {
      if (isNaN(Number(e))) {
        elements.push(spellElement[e as keyof typeof spellElement]);
      }
    }
    if (elements.length === 0) {
      console.error("spellElement enum is empty or not properly defined");
      return null;
    }

    return elements.map((element) => (
      <FormControlLabel
        key={getElementName(element)}
        control={
          <Checkbox
            checked={selectedSpellElements.includes(element)}
            onChange={() => handleSpellElementChange(element)}
            disabled={isSpellElementDisabled(element)}
          />
        }
        label={getElementName(element)}
      />
    ));
  };

  useEffect(() => {
    if (heroType === heroClass.Cleric) {
      // Automatically select all elements for Cleric if not already selected
      setSelectedSpellElements([
        spellElement.Earth,
        spellElement.Water,
        spellElement.Fire,
      ]);
    } else if (heroType === heroClass.Elf) {
      // Clear selections when switching away from elf or cleric
      setSelectedSpellElements([spellElement.Fire]);
    } else {
      setSelectedSpellElements([]);
    }
  }, [heroType]);

  const handleSubmit = () => {
    if (!gameState) return;

    const payload = {
      gameId,
      playerId: socket.id,
      heroType,
      stats: {
        attackDice: formErrors.attackDice
          ? null
          : Number(formErrors.attackDice),
        defenseDice: formErrors.defenseDice
          ? null
          : Number(formErrors.defenseDice),
        hp: formErrors.hp ? null : Number(formErrors.hp),
        sp: formErrors.sp ? null : Number(formErrors.sp),
        gold: formErrors.gold ? null : Number(formErrors.gold),
      },
      spells: selectedSpellElements,
    };

    socket.emit(
      "choose-character",
      payload,
      (response: { success: boolean; error?: string }) => {
        if (response.success) {
          console.log(playerName, gameState);
          alert("Character successfully chosen!");

          navigate("/lobby", {
            state: { playerName: playerName, game: gameState },
          });
        } else {
          alert(`Error: ${response.error}`);
        }
      }
    );
  };

  return (
    <div className="character-page">
      <h1>Choisissez votre personnage {playerName}</h1>
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
              formErrors.defenseDice ? "Doit être un nombre entre 0 et 10" : ""
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
          <label id="label-coins">pièces d'or</label>
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
        {[heroClass.Cleric, heroClass.Elf].includes(heroType) && (
          <div className="formElement">
            <label id="label-spell-elements">éléments de sort</label>
            {renderSpellElements()}
          </div>
        )}
        <div className="formElement">
          <button className="button" onClick={() => handleSubmit()}>
            sauvgarder les modification
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChooseCharacter;
