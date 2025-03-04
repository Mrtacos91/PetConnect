import React, { useState, useEffect } from "react";
import "../styles/LocationCard.css";
import { FaMapMarkerAlt } from "react-icons/fa";

// 📌 Propiedades del componente
interface LocationCardProps {
  location: string;
  hour: string;
  lastLocation: string;
  name: string;
  viewMap: () => void;
  setActiveTab: (tab: string) => void;
}

const LocationCard: React.FC<LocationCardProps> = ({
  location,
  hour,
  lastLocation,
  name,
  viewMap,
  setActiveTab,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 2000); // Simula el tiempo de carga
  }, []);

  const handleCardClick = () => {
    setActiveTab("localizar"); // 🔹 Cambiamos a la pestaña de actividades
  };

  return (
    <div className="highlight-container-location" onClick={handleCardClick}>
      <h2 className="highlight-title-location">Ubicación actual</h2>

      {isLoading ? (
        // 🔹 Skeleton Loader
        <div className="skeleton-container-location">
          <div className="skeleton skeleton-button-location"></div>
          <div className="skeleton skeleton-text-location"></div>
          <div className="skeleton skeleton-text-location"></div>
          <div className="skeleton skeleton-text-location"></div>
          <div className="skeleton skeleton-text-location"></div>
        </div>
      ) : (
        // 🔹 Contenido real
        <div className="location-card">
          <div className="location-card__header">
            <button className="location-card__button" onClick={viewMap}>
              Ver en el mapa <FaMapMarkerAlt />
            </button>
          </div>

          {/* Información de la ubicación */}
          <div className="location-card__info">
            <p>
              🐾 <strong>{name}</strong>
            </p>
            <p>
              📍 <strong>Ubicación actual:</strong> {location}
            </p>
            <p>
              🕒 <strong>Última actualización:</strong> {hour}
            </p>
            <p>
              🔄 <strong>Última ubicación registrada:</strong> {lastLocation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationCard;
