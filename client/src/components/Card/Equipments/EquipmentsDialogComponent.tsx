import { Socket } from "socket.io-client";
import { HeroAsJson } from "../../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { useLocation } from "react-router-dom";
import { PlayerRole } from "../../../POO/enums/PlayerRole";
import { useEffect, useState } from "react";
import { ArmorAsJson } from "../../../POO/interfaces/ClassAsJson/Equipment/ArmorAsJson";
import { WeaponAsJson } from "../../../POO/interfaces/ClassAsJson/Equipment/WeaponAsJson";
import { PotionAsJson } from "../../../POO/interfaces/ClassAsJson/Equipment/PotionAsJson";
import Dialog from "@mui/material/Dialog";
import { CardSelectionComponent } from "../CardSelectionComponent";
import {
  flattenEquipment,
  getAllEquipmentsAsCards,
} from "../../../shared/equipments";
import { getAllTreasuresItems, getItemAsCard } from "../cardUtils";
import { ItemAsJson } from "../../../POO/interfaces/ClassAsJson/Equipment/ItemAsJson";
import { toast } from "react-toastify";
import RotatableCard3D from "../../small_components/RotatableCard3D";
import { GameAsJson } from "../../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { MonsterAsJson } from "../../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { isHero } from "../../../shared/utils";

interface EquipmentsDialogComponentProps {
  socket: Socket;
  hero: HeroAsJson;
}

const EquipmentsDialogComponent = (props: EquipmentsDialogComponentProps) => {
  const state = useLocation().state as { gameId: string; role: PlayerRole };
  const gameId = state.gameId;
  const role = state.role;

  const { socket, hero } = props;
  const equipment = hero.equipment;

  const [armors, setArmors] = useState<ArmorAsJson[]>(equipment.armors);
  const [weapons, setWeapons] = useState<WeaponAsJson[]>(equipment.weapons);
  const [potions, setPotions] = useState<PotionAsJson[]>(equipment.potions);
  const [tools, setTools] = useState<ItemAsJson[]>(equipment.tools);
  const [gold, setGold] = useState<number>(equipment.gold);

  const [editionState, setEditionState] = useState(false);

  const equipmentList = <T extends ItemAsJson>(
    equipments: T[],
    setEquipments: (equipments: T[]) => void,
  ) => (
    <ul>
      {equipments.map((equipment: ItemAsJson) => (
        <li key={equipment.id}>
          <div>
            {equipment.name}
            {equipment.type === "Potion" &&
              hero.controlledByPlayerId === socket.id && (
                <button className="positive-button" onClick={() => drinkPotion(equipment.id)}>
                  boire
                </button>
              )}
            <button className="classic-button" onClick={() => openItemDetails(equipment)}>
              détails
            </button>

            {editionState && role === PlayerRole.GAME_MASTER && (
              <button
                className="warning-button"
                onClick={() => {
                  const updatedEquipments = equipments.filter(
                    (e) => e.id !== equipment.id,
                  );
                  setEquipments(updatedEquipments);
                }}
              >
                Supprimer
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
  function openItemDetails(item: ItemAsJson): void {
    const cardData = getItemAsCard(item.id);
    toast.info(RotatableCard3D, {
      data: cardData,
      style: { minWidth: "fit-content" },
      icon: false,
    });
  }

  function saveEditions(): void {
    socket.emit(
      "updateEquipment",
      {
        gameId,
        heroId: hero.id,
        equipment: equipmentAsCards.map((card) => card.id),
        gold: gold,
      },
      (response: { success: boolean; error: string }) => {
        if (response.success) {
          toast.success("Équipement mis à jour avec succès !");

          setEditionState(false);
          // TODO : update local equipment state with the new one
        } else {
          toast.error(
            "Erreur lors de la mise à jour de l'équipement : " + response.error,
          );
        }
      },
    );

    setEditionState(false);
  }

  useEffect(() => {
    const handleGameStateUpdate = (data: { game: GameAsJson }) => {
      const updatedHero = data.game.gameState.Units.find(
        (unit: HeroAsJson | MonsterAsJson) => unit.id === hero.id,
      );
      if (!updatedHero || !isHero(updatedHero)) {
        return;
      }
      setArmors(updatedHero.equipment.armors);
      setWeapons(updatedHero.equipment.weapons);
      setPotions(updatedHero.equipment.potions);
      setTools(updatedHero.equipment.tools);
      setGold(updatedHero.equipment.gold);

    };

    socket.on("game-state-update", handleGameStateUpdate);

    return () => {
      socket.off("game-state-update", handleGameStateUpdate);
    };
  }, [socket, hero.id]);

  function drinkPotion(potionId: string): void {
    socket.emit(
      "drink-potion",
      {
        gameId,
        heroId: hero.id,
        potionId: potionId,
      },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          toast.error(
            "Erreur lors de l'utilisation de la potion : " + response.error,
          );
        }
      },
    );
  }

  const [equipmentAsCards, setEquipmentAsCards] = useState(() => {
    return flattenEquipment(equipment).map((e) => getItemAsCard(e));
  });

  const [openAddEquipmentDialog, setOpenAddEquipmentDialog] = useState(false);
  const [openAddTreasureDialog, setOpenAddTreasureDialog] = useState(false);

  const openAddEquipmentMenu = () => {
    setOpenAddEquipmentDialog(true);
  };

  const closeAddEquipmentMenu = () => {
    setOpenAddEquipmentDialog(false);
    saveEditions();
  };

  const openAddTreasureMenu = () => {
    setOpenAddTreasureDialog(true);
  };

  const closeAddTreasureMenu = () => {
    setOpenAddTreasureDialog(false);
    saveEditions();
  };

  return (
    <div className="equipments-dialog">
      <h2>Équipements</h2>
      <h3>Armure</h3>
      {equipmentList(armors, setArmors)}
      <h3>Armes</h3>
      {equipmentList(weapons, setWeapons)}
      <h3>Potions</h3>
      {equipmentList(potions, setPotions)}
      <h3>Outils</h3>
      {equipmentList(tools, setTools)}
      <p>
        Or :{" "}
        {editionState ? (
          <input
            type="number"
            value={gold}
            onChange={(e) => setGold(Number(e.target.value))}
          />
        ) : (
          gold
        )}
      </p>
      {role === PlayerRole.GAME_MASTER && !editionState && (
        <button className="classic-button" onClick={() => setEditionState(true)}>
          Édition
        </button>
      )}
      {editionState && role === PlayerRole.GAME_MASTER && (
        <button className="classic-button" onClick={() => saveEditions()}>
          Terminer l&apos;édition
        </button>
      )}
      {editionState && role === PlayerRole.GAME_MASTER && (
        <>
          <button className="classic-button" onClick={() => openAddEquipmentMenu()}>
            ajouter un équipement
          </button>
          <button className="classic-button" onClick={() => openAddTreasureMenu()}>
            ajouter un trésor
          </button>
        </>
      )}
      <Dialog open={openAddEquipmentDialog} onClose={closeAddEquipmentMenu}>
        <div className="equipments-dialog">
          <CardSelectionComponent
            selectedCards={equipmentAsCards}
            cards={getAllEquipmentsAsCards()}
            onCardsChange={(newSelectedCards) => {
              setEquipmentAsCards(newSelectedCards);
            }}
          />
        </div>
      </Dialog>
      <Dialog open={openAddTreasureDialog} onClose={closeAddTreasureMenu}>
        <div className="equipments-dialog">
          <CardSelectionComponent
            selectedCards={equipmentAsCards}
            cards={getAllTreasuresItems()}
            onCardsChange={(newSelectedCards) => {
              setEquipmentAsCards(newSelectedCards);
            }}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default EquipmentsDialogComponent;
