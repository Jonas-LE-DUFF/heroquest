import { Dialog } from "@mui/material";
import { CardCarouselComponent } from "../CardCarouselComponent";
import { useLocation } from "react-router-dom";
import { EquipmentAsJson } from "../../../POO/interfaces/ClassAsJson/Equipment/EquipmentAsJson";
import { useState } from "react";
import { EquipmentSelectionComponent } from "../../EquipmentSelectionComponent";

export interface SimpleDialogProps {
  equipment: EquipmentAsJson;
  open: boolean;
  onClose: (value: EquipmentAsJson) => void;
}

const AddEquipmentDialogComponent = (props: SimpleDialogProps) => {
  const socket = useLocation().state?.socket;
  const [equipment, setEquipment] = useState<EquipmentAsJson>(props.equipment);
  return (
    <Dialog open={props.open} onClose={() => props.onClose(equipment)}>
      <div>Ajouter un équipement</div>
      <EquipmentSelectionComponent
        socket={socket}
        equipments={[]}
        onEquipmentsChange={function (equipments: string[]): void {
          throw new Error("Function not implemented.");
        }}
      />
    </Dialog>
  );
};

export default AddEquipmentDialogComponent;
