import React from "react";
import { SimpleCarousel } from "./SimpleCarousel";
import { getAllEquipmentCardNames } from "./cardUtils";
import { CardComponent } from "./CardComponent";

interface CardCarouselProps {
  socket: any;
  onCenterChange?: (id: string | undefined) => void;
}

const CardCarouselComponent = ({
  socket,
  onCenterChange,
}: CardCarouselProps) => {
  const equipmentCardNames = getAllEquipmentCardNames();

  function getImages(): any[] {
    const images: any[] = [];
    for (let i = 0; i < equipmentCardNames.length; i++) {
      images.push(
        <CardComponent
          socket={socket}
          cardName={equipmentCardNames[i]}
          cardType="equipment"
        />
      );
    }
    return images;
  }

  return (
    <div>
      <SimpleCarousel
        onIndexChange={(idx) => onCenterChange?.(equipmentCardNames[idx])}
      >
        {getImages()}
      </SimpleCarousel>
    </div>
  );
};

export { CardCarouselComponent };
