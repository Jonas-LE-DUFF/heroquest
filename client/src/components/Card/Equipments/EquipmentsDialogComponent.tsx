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

interface EquipmentsDialogComponentProps {
  socket: Socket;
  hero: HeroAsJson;
}

interface Item {
  id: string;
  name: string;
}

const EquipmentsDialogComponent = (props: EquipmentsDialogComponentProps) => {
  const location = useLocation();
  const role = location.state?.role;

  const { socket, hero } = props;
  const equipment = hero.equipment;

  const [armors, setArmors] = useState<ArmorAsJson[]>(equipment.armors);
  const [weapons, setWeapons] = useState<WeaponAsJson[]>(equipment.weapons);
  const [potions, setPotions] = useState<PotionAsJson[]>(equipment.potions);
  const [gold, setGold] = useState<number>(equipment.gold);

  const [editionState, setEditionState] = useState(false);

  const equipmentList = <T extends Item>(
    equipments: T[],
    setEquipments: (equipments: T[]) => void,
  ) => (
    <ul>
      {equipments.map((equipment) => (
        <li key={equipment.id}>
          {equipment.name}
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
    const updatedEquipment: EquipmentAsJson = {
      armors,
      weapons,
      potions,
      gold,
      selectedWeaponIndex: hero.equipment.selectedWeaponIndex,
    };

    socket.emit(
      "updateEquipment",
      { updatedEquipment, heroId: hero.id },
      (response: { success: boolean; message: string }) => {
        if (response.success) {
          alert("Équipement mis à jour avec succès !");
          setEditionState(false);
        } else {
          alert(
            "Erreur lors de la mise à jour de l'équipement : " +
              response.message,
          );
        }
      },
    );

    setEditionState(false);
  }

  const equipmentAsCards = flattenEquipment(equipment).map((e) =>
    getItemAsCard(e),
  );

  const [openAddDialog, setOpenAddDialog] = useState(false);

  const openAddEquipmentMenu = () => {
    setOpenAddDialog(true);
  };

  const closeAddEquipmentMenu = (value: EquipmentAsJson) => {
    setOpenAddDialog(false);
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
        <CardSelectionComponent
          socket={socket}
          selectedCards={equipmentAsCards}
          cards={getAllEquipmentsAsCards()}
          onCardsChange={() => console.log("cards changed")}
        />
      </Dialog>
    </div>
  );
};

export default EquipmentsDialogComponent;
