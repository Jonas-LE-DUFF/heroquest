import { useState } from "react";
import { CardCarouselComponent } from "./CardCarouselComponent";
import { Card } from "./Card";
import { toast } from "react-toastify";

interface CardSelectionComponentProps {
  socket: any;
  selectedCards: Card[];
  cards: Card[];
  onCardsChange: (cards: Card[]) => void;
}

export const CardSelectionComponent: React.FC<CardSelectionComponentProps> = ({
  socket,
  selectedCards = [],
  cards: cards,
  onCardsChange,
}) => {
  const [centerCard, setCenterCard] = useState<Card | undefined>(cards[0]);

  const handleAddCard = () => {
    if (!centerCard) {
      toast.error("Aucune carte sélectionnée");
      return;
    }
    onCardsChange([...selectedCards, centerCard]);
  };

  const handleClearCards = () => {
    onCardsChange([]);
  };

  return (
    <div style={{ width: "100%" }}>
      <div>
        équipements : {selectedCards.map((card) => card.name).join(", ")}
      </div>
      <CardCarouselComponent
        socket={socket}
        cards={cards}
        onCenterChange={(id) =>
          setCenterCard(cards.find((card) => card.id === id))
        }
      />
      <div className="buttons">
        <button onClick={handleAddCard}>
          ajouter equipement : {centerCard?.name || "Aucune carte sélectionnée"}
        </button>
        <button onClick={handleClearCards}>retirer tout les équipements</button>
      </div>
    </div>
  );
};
