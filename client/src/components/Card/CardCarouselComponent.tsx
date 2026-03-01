import { SimpleCarousel } from "./SimpleCarousel";
import { CardComponent } from "./CardComponent";
import { Card } from "./Card";

interface CardCarouselProps {
  socket: any;
  cards: Card[];
  onCenterChange?: (id: string | undefined) => void;
}

const CardCarouselComponent = ({
  socket,
  cards,
  onCenterChange,
}: CardCarouselProps) => {
  function getImages(): any[] {
    const images: any[] = [];
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
