import { Socket } from "socket.io-client";
import { EquipmentAsJson } from "../../../POO/interfaces/ClassAsJson/Equipment/EquipmentAsJson";
import { HeroAsJson } from "../../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";

interface EquipmentsDialogComponentProps {
  socket: Socket;
  hero: HeroAsJson;
}

const EquipmentsDialogComponent = (props: EquipmentsDialogComponentProps) => {
  const equipment: EquipmentAsJson = props.hero.equipment;
  const armor = equipment.armors;
  const weapons = equipment.weapons;
  const potions = equipment.potions;
  const gold = equipment.gold;
  return (
    <div className="equipments-dialog">
      <h2>Équipements</h2>
      <h3>Armure</h3>
      <ul>
        {armor.map((equipment) => (
          <li key={equipment.id}>{equipment.name}</li>
        ))}
      </ul>
      <h3>Armes</h3>
      <ul>
        {weapons.map((equipment) => (
          <li key={equipment.id}>{equipment.name}</li>
        ))}
      </ul>
      <h3>Potions</h3>
      <ul>
        {potions.map((equipment) => (
          <li key={equipment.id}>{equipment.name}</li>
        ))}
      </ul>
      <p>Or : {gold} pièces d'or</p>
    </div>
  );
};

export default EquipmentsDialogComponent;
