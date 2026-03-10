import { Card } from "./Card";

interface CardProps {
  card: Card;
}

const CardComponent = ({ card }: CardProps) => {
  return <img src={card.image_path} alt={card.name} className="card" />;
};

const BackCardComponent = ({ card }: CardProps) => {
  return <img src={card.back_image_path} alt={card.name} className="card" />;
};

const GreyCardComponent = ({ card }: CardProps) => {
  return <img src={card.image_path} alt={card.name} className="card greyish" />;
};

const GreyBackCardComponent = ({ card }: CardProps) => {
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
