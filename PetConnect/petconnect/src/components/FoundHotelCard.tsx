import React, { useState, useEffect } from "react";
import "../styles/FoundHotelCard.css";

interface FoundHotelCardProps {
  Info: string;
}

const FoundHotelCard: React.FC<FoundHotelCardProps> = ({ Info }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 2000); // Simula la carga durante 2 segundos
  }, []);

  return (
    <div className="Container-FoundHotel">
      <h2 className="Container-Title-FoundHotel">Encuentra un hotel</h2>

      {isLoading ? (
        // 🔹 Skeleton Loader
        <div className="skeleton-container-foundHotel">
          <div className="skeleton skeleton-text-foundHotel"></div>
          <div className="skeleton skeleton-text-foundHotel"></div>
        </div>
      ) : (
        // 🔹 Contenido real
        <div className="FoundHotel-Card">
          <h3 className="FoundHotel-info">
            <strong>¿Necesitas dónde hospedar a tu mascota?</strong>
          </h3>
          <p>{Info}</p>
        </div>
      )}
    </div>
  );
};

export default FoundHotelCard;
