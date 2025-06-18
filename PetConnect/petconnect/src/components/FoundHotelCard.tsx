import React, { useState, useEffect } from "react";
import "../styles/FoundHotelCard.css";

interface FoundHotelCardProps {
  Info: string;
  url?: string; // URL opcional para redirección
}

const FoundHotelCard: React.FC<FoundHotelCardProps> = ({
  Info,
  url = "https://www.google.com/maps/search/hoteles+pet+friendly+cerca+de+mi/@19.5554008,-99.3144218,12z/data=!3m1!4b1?entry=ttu&g_ep=EgoyMDI1MDYxNS4wIKXMDSoASAFQAw%3D%3D", // URL por defecto
}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 2000); // Simula la carga durante 2 segundos
  }, []);

  const handleCardClick = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="Container-FoundHotel"
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
    >
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
            <strong>¿Necesitas hospedarte con tu mascota?</strong>
          </h3>
          <p>{Info}</p>
        </div>
      )}
    </div>
  );
};

export default FoundHotelCard;
