import React, { useState, useEffect } from "react";
import "../styles/FoundDoctorCard.css";

interface FoundDoctorCardProps {
  Info: string;
  url?: string; // URL opcional para redirección
}

const FoundDoctorCard: React.FC<FoundDoctorCardProps> = ({
  Info,
  url = "https://www.google.com/maps/search/veterinario+cerca+de+mi/@19.572349,-99.2405352,14z/data=!3m1!4b1?entry=ttu&g_ep=EgoyMDI1MDMxOS4yIKXMDSoASAFQAw%3D%3D", // URL por defecto
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
      className="Container-FoundDoctor"
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
    >
      <h2 className="Container-Title-FoundDoctor">Encuentra un veterinario</h2>

      {isLoading ? (
        // 🔹 Skeleton Loader
        <div className="skeleton-container-foundDoctor">
          <div className="skeleton skeleton-text-foundDoctor"></div>
          <div className="skeleton skeleton-text-foundDoctor"></div>
        </div>
      ) : (
        // 🔹 Contenido real
        <div className="FoundDoctor-Card">
          <h3 className="FoundDoctor-info">
            <strong>¿Necesitas ayuda urgente?</strong>
          </h3>
          <p>{Info}</p>
        </div>
      )}
    </div>
  );
};

export default FoundDoctorCard;
