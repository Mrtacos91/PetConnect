import React from "react";
import "../styles/HighlightCard.css";

interface HighlightCardProps {
  imageUrl: string;
  name: string;
  type: string;
  breed: string;
  age: number;
}

const HighlightCard: React.FC<HighlightCardProps> = ({
  imageUrl,
  name,
  type,
  breed,
  age,
}) => {
  return (
    <div className="highlight-card">
      <img src={imageUrl} alt={name} className="pet-image" />
      <div className="pet-info">
        <h3>{name}</h3>
        <p>
          <strong>Tipo:</strong> {type}
        </p>
        <p>
          <strong>Raza:</strong> {breed}
        </p>
        <p>
          <strong>Edad:</strong> {age} años
        </p>
      </div>
    </div>
  );
};

export default HighlightCard;
