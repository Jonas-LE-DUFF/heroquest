import { SimpleCarousel } from "./SimpleCarousel";
import { CardComponent } from "./CardComponent";
import { CardAsJson } from "../../POO/interfaces/ClassAsJson/CardAsJson";
import React from "react";

interface CardCarouselProps {
  cards: CardAsJson[];
  onCenterChange?: (id: string | undefined) => void;
}

const CardCarouselComponent = ({
  cards,
  onCenterChange,
}: CardCarouselProps) => {
  function getImages(): React.JSX.Element[] {
    const images: React.JSX.Element[] = [];
    for (let i = 0; i < cards.length; i++) {
      images.push(
        <div className="singleSpellCard">
          <CardComponent card={cards[i]} />
        </div>,
      );
    }
    return images;
  }

  return (
    <div>
      <SimpleCarousel onIndexChange={(idx) => onCenterChange?.(cards[idx]?.id)}>
        {getImages()}
      </SimpleCarousel>
    </div>
  );
};

export { CardCarouselComponent };
