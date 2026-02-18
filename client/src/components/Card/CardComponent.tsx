import { Card } from "./Card";

interface CardProps {
  socket: any;
  card: Card;
}

const CardComponent = ({ socket, card }: CardProps) => {
  return (
    <img
      src={card.image_path}
      alt={card.name}
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

const BackCardComponent = ({ socket, card }: CardProps) => {
  return (
    <img
      src={card.back_image_path}
      alt={card.name}
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

export { CardComponent, BackCardComponent };
