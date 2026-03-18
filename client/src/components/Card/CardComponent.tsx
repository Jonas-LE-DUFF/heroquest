import { CardAsJson } from "../../POO/interfaces/ClassAsJson/CardAsJson";

interface CardProps {
  card: CardAsJson;
}

const CardComponent = ({ card }: CardProps) => {
  return <img src={card.imgPath} alt={card.name} className="card" />;
};

const BackCardComponent = ({ card }: CardProps) => {
  return <img src={card.backImgPath} alt={card.name} className="card" />;
};

const GreyCardComponent = ({ card }: CardProps) => {
  return <img src={card.imgPath} alt={card.name} className="card greyish" />;
};

const GreyBackCardComponent = ({ card }: CardProps) => {
  return (
    <img src={card.backImgPath} alt={card.name} className="card greyish" />
  );
};

export {
  CardComponent,
  BackCardComponent,
  GreyBackCardComponent,
  GreyCardComponent,
};
