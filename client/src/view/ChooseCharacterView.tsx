import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GamePageView.css";
import {
  FormControlLabel,
  Select,
  SelectChangeEvent,
  TextField,
  Checkbox,
  Paper,
} from "@mui/material";
import "./ChooseCharacterView.css";
import { renderHeroClassOptions } from "../shared/selectHeroClass";
import { CardSelectionComponent } from "../components/Card/CardSelectionComponent";
import {
  BackCardComponent,
  GreyCardComponent,
} from "../components/Card/CardComponent";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { GameAsJson } from "../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { getHeroes } from "../shared/serverUtils";
import { SpellElement } from "../POO/enums/SpellElement";
import { HeroCreationWish } from "../POO/interfaces/ClassAsJson/FromClient/HeroCreationWish";
import {
  flattenEquipment,
  getAllEquipmentsAsCards,
  getEquipmentById,
} from "../shared/equipments";
import { getSpellEllementAsCard } from "../components/Card/cardUtils";
import { HeroAsJson } from "../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { toast } from "react-toastify";
import { CardType } from "../POO/interfaces/ClassAsJson/CardAsJson";
import { Socket } from "socket.io-client";
import { LocationState } from "../POO/types/LocationType";

interface ChooseCharacterProps {
  socket: Socket;
}

const ChooseCharacter: React.FC<ChooseCharacterProps> = ({ socket }) => {
  const navigate = useNavigate();
  const state = useLocation().state as LocationState & {
    hero?: HeroAsJson;
  };

  const playerName =
    state.game.players.find((p) => p.id === state.playerId)?.name ||
    "Unknown Player";

  const [game, setGame] = useState<GameAsJson>(state.game);

  const { hero } = state;

  const modifiedHero = hero;

  const [heroCreation, setHeroCreation] = useState<HeroCreationWish>({
    gameId: game.id,
    name: playerName,
    heroCategory: modifiedHero?.category || getAvailableClasses()[0],
    gold: modifiedHero?.equipment?.gold || 0,
    spellElements: modifiedHero?.spellElements || [],
    equipments: modifiedHero ? flattenEquipment(modifiedHero.equipment) : [],
    modifiedHeroId: modifiedHero?.id,
  });

  useEffect(() => {
    if (!game || !playerName) {
      console.error(
        `Données manquantes : ${playerName}, ${game.name}, redirection...`,
      );
      void navigate("/");
      return;
    }

    socket.on("game-state-update", (data: { game: GameAsJson }) => {
      setGame(data.game);
      state.game = data.game;
    });

    return () => {
      socket.off("game-state-update");
    };
  }, [navigate, playerName, game, socket, state]);

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
        return;
      }
      // Allow only one selection for Elf
      setHeroCreation((prev) => ({
        ...prev,
        spellElements: [element],
      }));
    } else if (
      heroCreation.heroCategory === HeroCategory.Cleric &&
      !heroCreation.spellElements.includes(element)
    ) {
      // Toggle selection for Cleric
      setHeroCreation((prev) => ({
        ...prev,
        spellElements: [...prev.spellElements, element],
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
    const spellElementsCards = Object.values(SpellElement).filter(
      (value) => typeof value === "string",
    ) as SpellElement[];

    if (spellElementsCards.length === 0) {
      console.error("spellElement enum is empty or not properly defined");
      return null;
    }

    return spellElementsCards.map((element: SpellElement) => {
      const card = getSpellEllementAsCard(element);
      return (
        <button
          key={element}
          className="singleSpellCard"
          onClick={() => {
            if (!isSpellElementDisabled(hero?.id ?? "", game, element))
              handleSpellElementChange(element);
          }}
        >
          <FormControlLabel
            key={card.id}
            control={
              <Checkbox
                checked={heroCreation.spellElements.includes(element)}
                onChange={() => handleSpellElementChange(element)}
                disabled={isSpellElementDisabled(hero?.id ?? "", game, element)}
              />
            }
            label={card.name}
          />
          {!isSpellElementDisabled(hero?.id ?? "", game, element) ? (
            <BackCardComponent card={card} />
          ) : (
            <GreyCardComponent card={card} />
          )}
        </button>
      );
    });
  };

  useEffect(() => {
    if (heroCreation.heroCategory === HeroCategory.Cleric) {
      if (heroCreation.spellElements.length === 3) {
        return;
      }
      if (heroCreation.spellElements.length > 3) {
        setHeroCreation((prev) => ({
          ...prev,
          spellElements: prev.spellElements.slice(1, 4), // keeping the last one added
        }));
        return;
      }
      // selects the first 3 available elements if the cleric doesn't have all of them already
      const selectedSpells: SpellElement[] = [];
      for (const e in SpellElement) {
        if (
          typeof e === "string" &&
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
      if (heroCreation.spellElements.length === 1) {
        return;
      }
      for (const e in SpellElement) {
        if (
          typeof e === "string" &&
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
      // Clear selections when switching away from elf or cleric
      setHeroCreation((prev) => ({
        ...prev,
        spellElements: [],
      }));
    }
  }, [
    socket,
    game,
    heroCreation.heroCategory,
    hero?.id,
    heroCreation.spellElements.length,
  ]);

  const handleSubmit = () => {
    if (!game) {
      toast.error("Game state is missing. Cannot submit character creation.");
      void navigate("/");
      return;
    }

    console.debug("Submitting hero creation:", heroCreation);

    socket.emit(
      "choose-character",
      {
        heroCreationWish: heroCreation,
        gameId: game.id,
        playerId: state.playerId,
      },
      (response: { success: boolean; error?: string; data?: GameAsJson }) => {
        if (response.success && response.data) {
          void navigate("/lobby", {
            state: {
              playerName: playerName,
              game: response.data,
              playerId: state.playerId,
            },
          });
        } else {
          toast.error(`Error: ${response.error}`);
        }
      },
    );
  };

  const goBackToLobby = () => {
    void navigate("/lobby", {
      state: { playerName: playerName, game: game, playerId: state.playerId },
    });
  };

  return (
    <div className="page-container">
      <Paper elevation={5} className="character-page">
        <h1>Choisissez votre personnage {playerName}</h1>
        <div className="form">
          <div className="form-grid">
            <p id="label-hero-class">Classe : </p>
            <Select
              className="select"
              labelId="label-hero-class"
              id="select-hero-class"
              value={heroCreation.heroCategory}
              onChange={handleChangeHeroClass}
            >
              {renderHeroClassOptions(getSelectedClasses())}
            </Select>
            <p id="label-coins">Pièces d&apos;or : </p>
            <TextField
              className="input"
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
            <p id="label-spell-elements">Éléments de sort</p>
              <div className="spellCards">{renderSpellElements()}</div>
            </div>
          )}

          <CardSelectionComponent
            cards={getAllEquipmentsAsCards()}
            selectedCards={heroCreation.equipments.map((id) => {
              const equipment = getEquipmentById(id);
              return {
                id,
                name: equipment?.name ?? id,
                imgPath: equipment?.image_path ?? "",
                backImgPath: equipment?.image_path ?? "",
                type: CardType.Item,
              };
            })}
            onCardsChange={(equipments) =>
              setHeroCreation((prev) => ({
                ...prev,
                equipments: equipments.map((e) => e.id),
              }))
            }
          />
          <div>
            <button className="classic-button" onClick={() => handleSubmit()}>
              Sauvegarder les modifications
            </button>
            <button className="warning-button" onClick={() => goBackToLobby()}>
              Annuler
            </button>
          </div>
        </div>
      </Paper>
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
