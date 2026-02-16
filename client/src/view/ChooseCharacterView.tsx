import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GamePageView.css";
import {
  FormControlLabel,
  Select,
  SelectChangeEvent,
  TextField,
  Checkbox,
} from "@mui/material";
import { getElementName } from "../shared/utils";
import "./ChooseCharacterView.css";
import { renderHeroClassOptions } from "../shared/selectHeroClass";
import { EquipmentSelectionComponent } from "../components/EquipmentSelectionComponent";
import { CardComponent } from "../components/Card/CardComponent";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { GameAsJson } from "../POO/interfaces/ClassAsJson/Server/GameAsJson";
import {
  getHeroByPlayerId,
  getHeroes,
  getPlayerBySocketId,
} from "../shared/serverUtils";
import { SpellElement } from "../POO/enums/SpellElement";
import { HeroCreationWish } from "../POO/interfaces/ClassAsJson/FromClient/HeroCreationWish";

interface ChooseCharacterProps {
  socket: any;
}

const ChooseCharacter: React.FC<ChooseCharacterProps> = ({ socket }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [game, setGame] = useState<GameAsJson>(location.state?.game || null);

  const { playerName, gameId } = location.state || {};

  const hero = getHeroByPlayerId(socket.id, game);

  const [heroCreation, setHeroCreation] = useState<HeroCreationWish>({
    gameId: game.id,
    name: playerName,
    heroCategory: getAvailableClasses()[0],
    gold: 0,
    spellElements: [],
    equipments: [],
  });

  socket.on("game-state-update", (data: { game: GameAsJson }) => {
    setGame(data.game);
    location.state.game = data.game;
  });

  function getSelectedClasses() {
    const selectedClasses = new Set<HeroCategory>();
    getHeroes(game.gameState.Units).forEach((hero) =>
      selectedClasses.add(hero.category),
    );
    return selectedClasses;
  }

  function getAvailableClasses() {
    const selectedClasses = getSelectedClasses();
    const allClasses = Object.values(HeroCategory).filter(
      (value) => typeof value === "number",
    ) as number[];
    return allClasses.filter((cls) => !selectedClasses.has(cls));
  }

  const handleChangeHeroClass = (event: SelectChangeEvent<number>) => {
    setHeroCreation((prev) => ({
      ...prev,
      heroCategory: Number(event.target.value),
    }));
  };

  const handleSpellElementChange = (element: SpellElement) => {
    if (heroCreation.heroCategory === HeroCategory.Elf) {
      if (heroCreation.spellElements.includes(element)) {
        // Deselect if already selected
        setHeroCreation((prev) => ({
          ...prev,
          spellElements: [],
        }));
        return false;
      }
      // Allow only one selection for Elf
      setHeroCreation((prev) => ({
        ...prev,
        spellElements: [element],
      }));
    } else if (heroCreation.heroCategory === HeroCategory.Cleric) {
      // Toggle selection for Cleric
      setHeroCreation((prev) => ({
        ...prev,
        spellElements: prev.spellElements.includes(element)
          ? prev.spellElements.filter((el) => el !== element)
          : [...prev.spellElements, element],
      }));
    }
  };

  const renderSpellElements = () => {
    if (
      heroCreation.heroCategory !== HeroCategory.Elf &&
      heroCreation.heroCategory !== HeroCategory.Cleric
    ) {
      return null;
    }
    const elements: SpellElement[] = [];
    for (const e in SpellElement) {
      if (isNaN(Number(e))) {
        elements.push(SpellElement[e as keyof typeof SpellElement]);
      }
    }
    if (elements.length === 0) {
      console.error("spellElement enum is empty or not properly defined");
      return null;
    }

    return elements.map((element) => (
      <div
        className="singleSpellCard"
        role="button"
        onClick={() => handleSpellElementChange(element)}
      >
        <FormControlLabel
          key={getElementName(element)}
          control={
            <Checkbox
              checked={heroCreation.spellElements.includes(element)}
              onChange={() => handleSpellElementChange(element)}
              disabled={isSpellElementDisabled(hero?.id ?? "", game, element)}
            />
          }
          label={getElementName(element)}
        />
        <CardComponent
          socket={socket}
          cardName={getElementName(element, "en")}
          cardType="back"
        />
      </div>
    ));
  };

  useEffect(() => {
    if (heroCreation.heroCategory === HeroCategory.Cleric) {
      // Automatically select all elements for Cleric if not already selected

      const selectedSpells: SpellElement[] = [];
      for (const e in SpellElement) {
        if (
          isNaN(Number(e)) &&
          !isSpellElementDisabled(
            hero?.id ?? "",
            game,
            SpellElement[e as keyof typeof SpellElement],
          )
        ) {
          selectedSpells.push(SpellElement[e as keyof typeof SpellElement]);
          if (selectedSpells.length === 3) break;
        }
      }
      setHeroCreation((prev) => ({
        ...prev,
        spellElements: selectedSpells,
      }));
    } else if (heroCreation.heroCategory === HeroCategory.Elf) {
      // Clear selections when switching away from elf or cleric
      for (const e in SpellElement) {
        if (
          isNaN(Number(e)) &&
          !isSpellElementDisabled(
            hero?.id ?? "",
            game,
            SpellElement[e as keyof typeof SpellElement],
          )
        ) {
          setHeroCreation((prev) => ({
            ...prev,
            spellElements: [SpellElement[e as keyof typeof SpellElement]],
          }));
          break;
        }
      }
    } else {
      setHeroCreation((prev) => ({
        ...prev,
        spellElements: [],
      }));
    }
  }, [socket, game, heroCreation.heroCategory]);

  const handleSubmit = () => {
    if (!game) return;

    console.debug("Submitting hero creation:", heroCreation);

    socket.emit(
      "choose-character",
      { heroCreationWish: heroCreation, gameId: game.id },
      (response: { success: boolean; error?: string; data?: GameAsJson }) => {
        if (response.success && response.data) {
          navigate("/lobby", {
            state: { playerName: playerName, game: response.data },
          });
        } else {
          alert(`Error: ${response.error}`);
        }
      },
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
            value={heroCreation.heroCategory}
            onChange={handleChangeHeroClass}
            autoWidth
          >
            {renderHeroClassOptions(getSelectedClasses())}
          </Select>
        </div>
        <div className="formElement">
          <label id="label-coins">pièces d'or</label>
          <TextField
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setHeroCreation((prev) => ({
                ...prev,
                gold: Math.max(0, Number(e.target.value)),
              }))
            }
            type="number"
            value={heroCreation.gold}
          />
        </div>
        {[HeroCategory.Cleric, HeroCategory.Elf].includes(
          heroCreation.heroCategory,
        ) && (
          <div className="spellList">
            <label id="label-spell-elements">éléments de sort</label>
            <div className="spellCards">{renderSpellElements()}</div>
          </div>
        )}

        <EquipmentSelectionComponent
          socket={socket}
          equipments={heroCreation.equipments}
          onEquipmentsChange={(equipments) =>
            setHeroCreation((prev) => ({ ...prev, equipments }))
          }
        />
        <div>
          <button className="button" onClick={() => handleSubmit()}>
            sauvegarder les modifications
          </button>
        </div>
      </div>
    </div>
  );
};

function isSpellElementDisabled(
  currentlyModifiedHeroId: string,
  game: GameAsJson,
  element: SpellElement,
) {
  if (!game) return false;
  const heroes = getHeroes(game.gameState.Units);
  for (let hero of heroes) {
    if (currentlyModifiedHeroId === hero.id) {
      continue; // Skip the current player's hero
    }
    if (hero.spellElements?.includes(element)) {
      return true;
    }
  }
  return false;
}

export default ChooseCharacter;
