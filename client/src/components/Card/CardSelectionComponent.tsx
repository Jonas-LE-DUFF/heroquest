import React, { useState } from "react";
import { CardCarouselComponent } from "./CardCarouselComponent";
import { toast } from "react-toastify";
import { CardAsJson } from "../../POO/interfaces/ClassAsJson/CardAsJson";

interface CardSelectionComponentProps {
  selectedCards: CardAsJson[];
  cards: CardAsJson[];
  onCardsChange: (cards: CardAsJson[]) => void;
}

export const CardSelectionComponent: React.FC<CardSelectionComponentProps> = ({
  selectedCards = [],
  cards: cards,
  onCardsChange,
}) => {
  const [centerCard, setCenterCard] = useState<CardAsJson | undefined>(cards[0]);

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
        cards={cards}
        onCenterChange={(id) =>
          setCenterCard(cards.find((card) => card.id === id))
        }
      />
      <div>
        <button className="positive-button" onClick={handleAddCard}>
          ajouter equipement : {centerCard?.name || "Aucune carte sélectionnée"}
        </button>
        <button className="warning-button" onClick={handleClearCards}>
          retirer tout les équipements
        </button>
      </div>
    </div>
  );
};
