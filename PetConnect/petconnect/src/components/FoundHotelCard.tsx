import React from "react";
import "../styles/FoundHotelCard.css";

interface FoundHotelCardProps {
  Info: string;
}

const FoundHotelCard: React.FC<FoundHotelCardProps> = ({ Info }) => {
  return (
    <div className="Container-FoundHotel">
      <h2 className="Container-Title-FoundHotel">Encuentra un hotel</h2>
      <div className="FoundHotel-Card">
        <h3 className="FoundHotel-info">
          {" "}
          <strong>Necesitas donde hospedar a tu mascota?</strong>
        </h3>
        <p>{Info}</p>
      </div>
    </div>
  );
};
export default FoundHotelCard;
