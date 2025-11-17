import { getCardImagePath } from "./cardUtils";

interface CardProps {
  socket: any;
  cardName: string;
  cardType: string;
}

const CardComponent = ({ socket, cardName, cardType }: CardProps) => {
  console.log(getCardImagePath(cardName, cardType));

  return (
    <img
      src={getCardImagePath(cardName, cardType)}
      alt="carte"
      style={{ maxWidth: "100px", height: "auto", display: "block" }}
    />
  );
};

export { CardComponent };
