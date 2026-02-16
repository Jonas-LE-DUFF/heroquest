import { EquipmentAsJson } from "../../../POO/interfaces/ClassAsJson/Equipment/EquipmentAsJson";

interface EquipmentsDialogComponentProps {
  equipment: EquipmentAsJson;
}

const EquipmentsDialogComponent = (props: EquipmentsDialogComponentProps) => {
  const armor = props.equipment.armors;
  const weapons = props.equipment.weapons;
  //const potions = props.equipment.potions;
  const gold = props.equipment.gold;
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
      {
        //TODO implement potions
      }
      <p>Or : {gold} pièces d'or</p>
    </div>
  );
};

export default EquipmentsDialogComponent;
