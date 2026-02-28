import { Socket } from "socket.io-client";
import { EquipmentAsJson } from "../../../POO/interfaces/ClassAsJson/Equipment/EquipmentAsJson";
import { HeroAsJson } from "../../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { useLocation } from "react-router-dom";
import { PlayerRole } from "../../../POO/enums/PlayerRole";
import { useState } from "react";
import { ArmorAsJson } from "../../../POO/interfaces/ClassAsJson/Equipment/ArmorAsJson";
import { WeaponAsJson } from "../../../POO/interfaces/ClassAsJson/Equipment/WeaponAsJson";
import { PotionAsJson } from "../../../POO/interfaces/ClassAsJson/Equipment/PotionAsJson";
import Dialog from "@mui/material/Dialog";
import { CardSelectionComponent } from "../CardSelectionComponent";
import {
  flattenEquipment,
  getAllEquipmentsAsCards,
} from "../../../shared/equipments";
import { getItemAsCard } from "../cardUtils";
import { ItemAsJson } from "../../../POO/interfaces/ClassAsJson/Equipment/ItemAsJson";
import { CardComponent } from "../CardComponent";

interface EquipmentsDialogComponentProps {
  socket: Socket;
  hero: HeroAsJson;
}

const EquipmentsDialogComponent = (props: EquipmentsDialogComponentProps) => {
  const location = useLocation();
  const gameId = location.state?.gameId;
  const role = location.state?.role;

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
      {equipments.map((equipment) => (
        <li key={equipment.id}>
          {equipment.name}
          {equipment.type === "Potion" && (
            <button onClick={() => drinkPotion(equipment.id)}>boire</button>
          )}

          {editionState && role === PlayerRole.GAME_MASTER && (
            <button
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
        </li>
      ))}
    </ul>
  );
  function saveEditions(): void {
    socket.emit(
      "updateEquipment",
      {
        gameId,
        heroId: hero.id,
        equipment: equipmentAsCards.map((card) => card.id),
      },
      (response: { success: boolean; error: string }) => {
        if (response.success) {
          alert("Équipement mis à jour avec succès !");

          setEditionState(false);
          // TODO : update local equipment state with the new one
        } else {
          alert(
            "Erreur lors de la mise à jour de l'équipement : " + response.error,
          );
        }
      },
    );

    setEditionState(false);
  }

  function drinkPotion(potionId: string): void {
    socket.emit(
      "drink-potion",
      {
        potionId: potionId,
        heroId: hero.id,
        gameId,
      },
      (response: { success: boolean; error: string }) => {
        if (response.success) {
          alert("Potion utilisée avec succès !");
        } else {
          alert(
            "Erreur lors de l'utilisation de la potion : " + response.error,
          );
        }
      },
    );
  }

  const [equipmentAsCards, setEquipmentAsCards] = useState(() => {
    return flattenEquipment(equipment).map((e) => getItemAsCard(e));
  });

  const [openAddDialog, setOpenAddDialog] = useState(false);

  const openAddEquipmentMenu = () => {
    setOpenAddDialog(true);
  };

  const closeAddEquipmentMenu = () => {
    setOpenAddDialog(false);
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
        <button onClick={() => setEditionState(true)}>Édition</button>
      )}
      {editionState && role === PlayerRole.GAME_MASTER && (
        <button onClick={() => saveEditions()}>Terminer l'édition</button>
      )}
      {editionState && role === PlayerRole.GAME_MASTER && (
        <button onClick={() => openAddEquipmentMenu()}>
          ajouter un équipement
        </button>
      )}
      <Dialog open={openAddDialog} onClose={closeAddEquipmentMenu}>
        <div className="equipments-dialog">
          <CardSelectionComponent
            socket={socket}
            selectedCards={equipmentAsCards}
            cards={getAllEquipmentsAsCards()}
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
