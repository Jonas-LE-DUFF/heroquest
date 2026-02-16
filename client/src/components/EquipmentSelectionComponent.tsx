import React, { useState } from "react";
import { CardCarouselComponent } from "./Card/CardCarouselComponent";
import { getCardName } from "./Card/cardUtils";

interface EquipmentSelectionComponentProps {
  socket: any;
  equipments: string[];
  onEquipmentsChange: (equipments: string[]) => void;
}

export const EquipmentSelectionComponent: React.FC<
  EquipmentSelectionComponentProps
> = ({ socket, equipments, onEquipmentsChange }) => {
  const [centerEquipment, setCenterEquipment] = useState<string | undefined>(
    undefined
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
        {equipments.map((id) => getCardName(id, "equipment")).join(", ")}
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
