import React, { useState } from "react";
import { CardCarouselComponent } from "../CardCarouselComponent";
import { getCardName } from "../cardUtils";
import { EquipmentAsJson } from "../../../POO/interfaces/ClassAsJson/Equipment/EquipmentAsJson";

interface EquipmentSelectionComponentProps {
  socket: any;
  equipments: EquipmentAsJson[];
  onEquipmentsChange: (equipments: string[]) => void;
}

export const EquipmentSelectionComponent: React.FC<
  EquipmentSelectionComponentProps
> = ({ socket, equipments, onEquipmentsChange }) => {
  const [centerEquipment, setCenterEquipment] = useState<string | undefined>(
    undefined,
  );

  const handleAddEquipment = () => {
    if (!centerEquipment) {
      alert("Aucune carte sélectionnée");
      return;
    }
    onEquipmentsChange([...equipments, centerEquipment]);
  };

  const handleClearEquipments = () => {
    onEquipmentsChange([]);
  };

  return (
    <div style={{ width: "100%" }}>
      <div>
        équipements :{" "}
        {equipments
          .map((equipment) => getCardName(equipment, "equipment"))
          .join(", ")}
      </div>
      <CardCarouselComponent
        socket={socket}
        onCenterChange={(id) => setCenterEquipment(id)}
      />
      <button onClick={handleAddEquipment}>
        ajouter equipement : {getCardName(centerEquipment ?? "", "equipment")}
      </button>
      <button onClick={handleClearEquipments}>
        retirer tout les équipements
      </button>
    </div>
  );
};
