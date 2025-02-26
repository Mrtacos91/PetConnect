import React, { useState, useEffect } from "react";
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 2000); // Simula el tiempo de carga
  }, []);

  return (
    <div className="highlight-container-MyPet">
      <h2 className="highlight-title-MyPet">Mi mascota</h2>

      {isLoading ? (
        // 🔹 Skeleton Loader
        <div className="skeleton-container-MyPet">
          <div className="skeleton skeleton-image-MyPet"></div>
          <div className="skeleton-text-MyPet">
            <div className="skeleton skeleton-title-MyPet"></div>
            <div className="skeleton skeleton-subtext-MyPet"></div>
            <div className="skeleton skeleton-subtext-MyPet"></div>
          </div>
        </div>
      ) : (
        // 🔹 Contenido real
        <div className="highlight-card-MyPet">
          <img src={imageUrl} alt={name} className="pet-image-MyPet" />
          <aside className="pet-info-MyPet">
            <h3>{name}</h3>
            <p>
              <strong>{type}</strong>
            </p>
            <p>
              <strong>{breed}</strong>
            </p>
          </aside>
        </div>
      )}
    </div>
  );
};

export default HighlightCard;
