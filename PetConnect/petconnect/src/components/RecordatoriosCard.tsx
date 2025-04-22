import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/RecordatoriosCard.css";
import { FaBell } from "react-icons/fa";

interface RecordatoriosCardProps {
  title?: string;
  description?: string;
  loading?: boolean;
}

const RecordatoriosCard: React.FC<RecordatoriosCardProps> = ({
  title = "Recordatorios",
  description = "Consulta y gestiona los recordatorios de tu mascota.",
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

  const handleNavigateToRecordatorios = () => {
    navigate("/recordatorios");
  };

  if (isLoading) {
    return (
      <div className="recordatorioscard-container skeleton-container">
        <div className="recordatorioscard-content">
          <div className="recordatorioscard-icon-skeleton skeleton"></div>
          <div className="recordatorioscard-title-skeleton skeleton"></div>
          <div className="recordatorioscard-description-skeleton skeleton"></div>
        </div>
        <div className="recordatorioscard-button-skeleton skeleton"></div>
      </div>
    );
  }

  return (
    <div className="recordatorioscard-container">
      <div className="recordatorioscard-content">
        <div className="recordatorioscard-icon">
          <FaBell />
        </div>
        <h3 className="recordatorioscard-title">{title}</h3>
        <p className="recordatorioscard-description">{description}</p>
      </div>
      <button
        className="recordatorioscard-button"
        onClick={handleNavigateToRecordatorios}
      >
        Ver Recordatorios
      </button>
    </div>
  );
};

export const RecordatoriosCardSkeleton: React.FC = () => (
  <div className="recordatorioscard-container skeleton-container">
    <div className="recordatorioscard-content">
      <div className="recordatorioscard-icon-skeleton skeleton"></div>
      <div className="recordatorioscard-title-skeleton skeleton"></div>
      <div className="recordatorioscard-description-skeleton skeleton"></div>
    </div>
    <div className="recordatorioscard-button-skeleton skeleton"></div>
  </div>
);

export default RecordatoriosCard;
