import { Card } from "./Card";

interface CardProps {
  socket: any;
  card: Card;
}

const CardComponent = ({ socket, card }: CardProps) => {
  return <img src={card.image_path} alt={card.name} className="card" />;
};

const BackCardComponent = ({ socket, card }: CardProps) => {
  return <img src={card.back_image_path} alt={card.name} className="card" />;
};

const GreyCardComponent = ({ socket, card }: CardProps) => {
  return <img src={card.image_path} alt={card.name} className="card greyish" />;
};

const GreyBackCardComponent = ({ socket, card }: CardProps) => {
  return (
    <img src={card.back_image_path} alt={card.name} className="card greyish" />
  );
};

export {
  CardComponent,
  BackCardComponent,
  GreyBackCardComponent,
  GreyCardComponent,
};
