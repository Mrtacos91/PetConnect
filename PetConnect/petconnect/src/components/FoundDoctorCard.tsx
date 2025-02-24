import React from "react";
import "../styles/FoundDoctorCard.css";

interface FoundDoctorCardProps {
  Info: string;
}

const FoundDoctorCard: React.FC<FoundDoctorCardProps> = ({ Info }) => {
  return (
    <div className="Container-FoundDoctor">
      <h2 className="Container-Title-FoundDoctor">Encuentra un veterinario</h2>
      <div className="FoundDoctor-Card">
        <h3 className="FoundDoctor-info">
          {" "}
          <strong>Necesitas ayuda urgente?</strong>
        </h3>
        <p>{Info}</p>
      </div>
    </div>
  );
};
export default FoundDoctorCard;
