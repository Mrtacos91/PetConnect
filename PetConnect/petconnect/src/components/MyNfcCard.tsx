import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Nfc.css";
import { FaCog } from "react-icons/fa"; // Using FaCog for settings icon

interface MyNfcCardProps {
  title?: string;
  description?: string;
  loading?: boolean;
}

const MyNfcCard: React.FC<MyNfcCardProps> = ({
  title = "Configurar NFC",
  description = "Administra la configuración de tu tarjeta NFC para compartir la información de tu mascota.",
  loading = false,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      setIsLoading(true);
      // Simulate loading even if actual loading prop is false, for consistent UI feel
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500); // Shorter delay than CarnetCard for potentially faster perceived load
    } else {
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleNavigateToNfcSettings = () => {
    // TODO: Update this path when the NFC settings page/route is created
    navigate("/nfc");
  };

  if (isLoading) {
    return (
      <div className="nfccard-container skeleton-container-nfc">
        <div className="skeleton-nfccard">
          <div className="skeleton skeleton-nfccard-icon"></div>
          <div className="skeleton skeleton-nfccard-title"></div>
          <div className="skeleton skeleton-nfccard-desc"></div>
        </div>
        <div className="skeleton skeleton-nfccard-btn"></div>
      </div>
    );
  }

  return (
    <div className="nfccard-container">
      <div className="nfccard-content">
        <div className="nfccard-icon">
          <FaCog />
        </div>
        <h3 className="nfccard-title">{title}</h3>
        <p className="nfccard-description">{description}</p>
      </div>
      <button className="nfccard-button" onClick={handleNavigateToNfcSettings}>
        Editar NFC
      </button>
    </div>
  );
};

// Optional: Skeleton component for MyNfcCard if specific styling is needed later
export const MyNfcCardSkeleton: React.FC = () => {
  return (
    <div className="nfccard-container skeleton-container">
      <div className="nfccard-content">
        <div className="nfccard-icon-skeleton skeleton"></div>
        <div className="nfccard-title-skeleton skeleton"></div>
        <div className="nfccard-description-skeleton skeleton"></div>
      </div>
      <div className="nfccard-button-skeleton skeleton"></div>
    </div>
  );
};

export default MyNfcCard;
