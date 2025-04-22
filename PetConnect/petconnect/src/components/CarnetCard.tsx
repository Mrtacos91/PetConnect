import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Carnet.css";
import { FaIdCard } from "react-icons/fa";

interface CarnetCardProps {
  title?: string;
  description?: string;
  loading?: boolean;
}

const CarnetCard: React.FC<CarnetCardProps> = ({
  title = "Carnet de Vacunación",
  description = "Accede al historial de vacunación de tu mascota y mantén al día sus registros médicos.",
  loading = false,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Skeleton loader SIEMPRE dura al menos 2 segundos, independiente de loading
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      setIsLoading(true);
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    } else {
      // Si loading es false, igual mostrar skeleton por 2 segundos
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleNavigateToCarnet = () => {
    navigate("/carnet");
  };

  if (isLoading) {
    return (
      <div className="carnetcard-container skeleton-container-carnet">
        <div className="skeleton-carnet-card">
          <div className="skeleton skeleton-carnet-icon"></div>
          <div className="skeleton skeleton-carnet-title"></div>
          <div className="skeleton skeleton-carnet-desc"></div>
        </div>
        <div className="skeleton skeleton-carnet-btn"></div>
      </div>
    );
  }

  return (
    <div className="carnetcard-container">
      <div className="carnetcard-content">
        <div className="carnetcard-icon">
          <FaIdCard />
        </div>
        <h3 className="carnetcard-title">{title}</h3>
        <p className="carnetcard-description">{description}</p>
      </div>
      <button className="carnetcard-button" onClick={handleNavigateToCarnet}>
        Ver Carnet
      </button>
    </div>
  );
};

// Componente Skeleton para CarnetCard
export const CarnetCardSkeleton: React.FC = () => {
  return (
    <div className="carnetcard-container skeleton-container">
      <div className="carnetcard-content">
        <div className="carnetcard-icon-skeleton skeleton"></div>
        <div className="carnetcard-title-skeleton skeleton"></div>
        <div className="carnetcard-description-skeleton skeleton"></div>
      </div>
      <div className="carnetcard-button-skeleton skeleton"></div>
    </div>
  );
};

export default CarnetCard;
