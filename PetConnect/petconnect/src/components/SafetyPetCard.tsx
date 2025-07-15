import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SafetyPetCard.css";
import { FaShieldAlt, FaHeartbeat } from "react-icons/fa";

interface SafetyPetCardProps {
  title?: string;
  description?: string;
  loading?: boolean;
}

const SafetyPetCard: React.FC<SafetyPetCardProps> = ({
  title = "Salud y Seguridad",
  description =
    "Consulta y gestiona la información de salud, vacunas y seguridad de tu mascota en un solo lugar. Mantén su bienestar siempre al día y accede rápidamente a datos importantes en caso de emergencia.",
  loading = false,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      setIsLoading(true);
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 1800);
    } else {
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 1800);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  if (isLoading) {
    return <SafetyPetCardSkeleton />;
  }

  return (
    <div className="safety-pet-card">
      <div className="safety-pet-card-header">
        <FaShieldAlt className="safety-pet-card-icon" />
        <h2 className="safety-pet-card-title">{title}</h2>
      </div>
      <div className="safety-pet-card-body">
        <p className="safety-pet-card-text">
          {description}
        </p>
        <button
          className="safety-pet-card-btn"
          onClick={() => navigate("/pet-health")}
        >
          <FaHeartbeat style={{ marginRight: 8 }} /> Ver Salud y Seguridad
        </button>
      </div>
    </div>
  );
};

export const SafetyPetCardSkeleton: React.FC = () => (
  <div className="safety-pet-card skeleton-container-safety">
    <div className="safety-pet-card-header">
      <div className="skeleton skeleton-safety-icon"></div>
      <div className="skeleton skeleton-safety-title"></div>
    </div>
    <div className="safety-pet-card-body">
      <div className="skeleton skeleton-safety-desc"></div>
      <div className="skeleton skeleton-safety-btn"></div>
    </div>
  </div>
);

export default SafetyPetCard;
