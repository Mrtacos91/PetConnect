import React, { useState, useEffect } from "react";
import "../styles/FoundDoctorCard.css";

interface FoundDoctorCardProps {
  Info: string;
}

const FoundDoctorCard: React.FC<FoundDoctorCardProps> = ({ Info }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 2000); // Simula la carga durante 2 segundos
  }, []);

  return (
    <div className="Container-FoundDoctor">
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
