import { getCardImagePath } from "./cardUtils";

interface CardProps {
  socket: any;
  cardName: string;
}

const CardComponent = ({ socket, cardName }: CardProps) => {
  const cardType = "equipment";
  console.log(getCardImagePath(cardName, cardType));

  return (
    <img
      src={getCardImagePath(cardName, cardType)}
      alt="carte"
      style={{ maxWidth: "100%", height: "auto", display: "block" }}
    />
  );
};

export { CardComponent };
