import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GamePageView.css";
import {
  heroClass,
  spellElement,
  Player,
  SendableGameState,
  Unit,
  GameState,
} from "../shared/type";
import {
  FormControlLabel,
  Select,
  SelectChangeEvent,
  TextField,
  Checkbox,
} from "@mui/material";
import {
  convertSendableGameStateAsGameState,
  getElementName,
} from "../shared/utils";
import "./ChooseCharacterView.css";
import { renderHeroClassOptions } from "../shared/selectHeroClass";
import { Socket } from "socket.io-client/build/esm/socket";

interface ChooseCharacterProps {
  socket: any;
}

const ChooseCharacter: React.FC<ChooseCharacterProps> = ({ socket }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [gameState, setGameState] = useState(location.state?.gameState || null);
  const { playerName, gameId } = location.state || {};
  const player: Player | undefined = gameState.players.get(socket.id);
  const [heroType, setHeroType] = useState<heroClass>(
    player?.class ?? getAvailableClasses()[0]
  );
  const [formErrors, setFormErrors] = useState({
    attackDice: false,
    defenseDice: false,
    hp: false,
    sp: false,
    gold: false,
  });

  const [formValues, setFormValues] = useState({
    nbAttackDice: player?.stats?.nbAttackDice ?? "1",
    nbDefenseDice: player?.stats?.nbDefenseDice ?? "1",
    hp: player?.stats?.hp ?? "1",
    spiritPoints: player?.stats?.spiritPoints ?? "1",
    gold: player?.stats?.gold?.toString() ?? "0",
    selectedSpellElements: player?.stats?.spells ?? ([] as spellElement[]),
  });

  socket.on("game-state-update", (data: { gameState: SendableGameState }) => {
    const gameState = convertSendableGameStateAsGameState(data.gameState);
    setGameState(gameState);
    location.state.gameState = gameState;
  });

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

    switch (fieldName) {
      case "attackDice":
        setFormValues({
          ...formValues,
          nbAttackDice: value,
        });
        break;
      case "defenseDice":
        setFormValues({
          ...formValues,
          nbDefenseDice: value,
        });
        break;
      case "hp":
        setFormValues({
          ...formValues,
          hp: value,
        });
        break;
      case "sp":
        setFormValues({
          ...formValues,
          spiritPoints: value,
        });
        break;
      case "gold":
        setFormValues({
          ...formValues,
          gold: value,
        });
        break;
    }
  };

  const handleSpellElementChange = (element: spellElement) => {
    if (heroType === heroClass.Elf) {
      if (formValues.selectedSpellElements.includes(element)) {
        // Deselect if already selected
        setFormValues((prev) => ({
          ...prev,
          selectedSpellElements: [],
        }));
        return false;
      }
      // Allow only one selection for Elf
      setFormValues((prev) => ({
        ...prev,
        selectedSpellElements: [element],
      }));
    } else if (heroType === heroClass.Cleric) {
      // Toggle selection for Cleric
      setFormValues((prev) => ({
        ...prev,
        selectedSpellElements: prev.selectedSpellElements.includes(element)
          ? prev.selectedSpellElements.filter((el) => el !== element)
          : [...prev.selectedSpellElements, element],
      }));
    }
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
            checked={formValues.selectedSpellElements.includes(element)}
            onChange={() => handleSpellElementChange(element)}
            disabled={isSpellElementDisabled(socket, gameState, element)}
          />
        }
        label={getElementName(element)}
      />
    ));
  };

  useEffect(() => {
    if (heroType === heroClass.Cleric) {
      // Automatically select all elements for Cleric if not already selected

      const selectedSpells: spellElement[] = [];
      for (const e in spellElement) {
        if (
          isNaN(Number(e)) &&
          !isSpellElementDisabled(
            socket,
            gameState,
            spellElement[e as keyof typeof spellElement]
          )
        ) {
          selectedSpells.push(spellElement[e as keyof typeof spellElement]);
          if (selectedSpells.length === 3) break;
        }
      }
      setFormValues((prev) => ({
        ...prev,
        selectedSpellElements: selectedSpells,
      }));
    } else if (heroType === heroClass.Elf) {
      // Clear selections when switching away from elf or cleric
      for (const e in spellElement) {
        if (
          isNaN(Number(e)) &&
          !isSpellElementDisabled(
            socket,
            gameState,
            spellElement[e as keyof typeof spellElement]
          )
        ) {
          setFormValues((prev) => ({
            ...prev,
            selectedSpellElements: [
              spellElement[e as keyof typeof spellElement],
            ],
          }));
          break;
        }
      }
    } else {
      setFormValues((prev) => ({
        ...prev,
        selectedSpellElements: [],
      }));
    }
  }, [socket, gameState, heroType]);

  const handleSubmit = () => {
    if (!gameState) return;
    if (
      Object.values(formErrors).some(
        (elem) => elem === null || elem === undefined
      ) ||
      Object.keys(formErrors).length === 0
    ) {
      alert(`Erreur : toutes les valeurs ne sont pas complétées`);
      return;
    }
    const { nbAttackDice, nbDefenseDice, hp, spiritPoints } = formValues;
    
    const stats: Unit = {
      nbAttackDice: Number(nbAttackDice),
      nbDefenseDice: Number(nbDefenseDice),
      hp: Number(hp),
      maxHp: Number(hp),
      spiritPoints: Number(spiritPoints),
      name: playerName,
      gold: Number(formValues.gold),
      spells: formValues.selectedSpellElements,
    };

    const statsSent = {
      gameId,
      playerId: socket.id,
      heroType: heroType,
      stats: stats,
    };

    socket.emit(
      "choose-character",
      statsSent,
      (response: {
        success: boolean;
        error?: string;
        gameState?: SendableGameState;
      }) => {
        if (response.success && response.gameState) {
          const game = convertSendableGameStateAsGameState(response.gameState);
          navigate("/lobby", {
            state: { playerName: playerName, game: game },
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
            {renderHeroClassOptions(getSelectedClasses())}
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
            value={formValues.nbAttackDice}
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
            value={formValues.nbDefenseDice}
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
            value={formValues.hp}
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
            value={formValues.spiritPoints}
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
            value={formValues.gold}
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

function isSpellElementDisabled(
  socket: Socket,
  game: GameState,
  element: spellElement
) {
  if (!game) return false;
  for (let player of game.players.values()) {
    if (player.id === socket.id) continue;
    if (player.stats?.spells?.includes(element)) {
      return true;
    }
  }
  return false;
}

export default ChooseCharacter;
