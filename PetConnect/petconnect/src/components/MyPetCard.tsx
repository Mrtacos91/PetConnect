import React from "react";
import "../styles/MyPet.css";

interface MyPetCardProps {
  imageUrl: string;
  name: string;
  type: string;
  breed: string;
}

const HighlightCard: React.FC<MyPetCardProps> = ({
  imageUrl,
  name,
  type,
  breed,
}) => {
  return (
    <div className="highlight-container-MyPet">
      <h2 className="highlight-title-MyPet">Mi mascota</h2>
      <div className="highlight-card-MyPet">
        <img src={imageUrl} alt={name} className="pet-image-MyPet" />
        <aside className="pet-info-MyPet">
          <h3>{name}</h3>
          <p>
            {" "}
            <strong>{type}</strong>
          </p>
          <p>
            <strong>{breed}</strong>
          </p>
        </aside>
      </div>
    </div>
  );
};

export default HighlightCard;
