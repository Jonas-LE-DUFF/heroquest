import { CardAsJson } from "../../POO/interfaces/ClassAsJson/CardAsJson";
import ThreeDCard from "./ThreeDCard";
import { ToastContentProps } from "react-toastify";

const RotatableCard3D = ({data}: ToastContentProps<CardAsJson>) => {
  return (
    <ThreeDCard
      className="three-d-card"
      backgroundImage={null}
      glowOpacity={0.3}
      shadowBlur={40}
      parallaxOffset={50}
      frontContent={
        <img
          src={data.imgPath}
          alt="Front of the card"
          style={{ maxHeight: "100%", maxWidth: "100%" }}
        />
      }
      backContent={
        <img
          src={data.backImgPath}
          alt="Back of the card"
          style={{ maxHeight: "100%", maxWidth: "100%" }}
        />
      }
    />
  );
};

export default RotatableCard3D;