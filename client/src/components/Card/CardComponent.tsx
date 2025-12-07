import { getCardImagePath } from "./cardUtils";

interface CardProps {
  socket: any;
  cardName: string;
  cardType: string;
}

const CardComponent = ({ socket, cardName, cardType }: CardProps) => {
  return (
    <img
      src={getCardImagePath(cardName, cardType)}
      alt={cardName}
      style={{
        width: "fit-content",
        height: "fit-content",
        maxHeight: "100%",
        maxWidth: "100%",
        display: "block",
        objectFit: "scale-down",
      }}
    />
  );
};

export { CardComponent };
