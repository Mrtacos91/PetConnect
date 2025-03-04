import React, { useState, useEffect } from "react";
import "../styles/ActivitiesCard.css";
import { FaStethoscope, FaWalking } from "react-icons/fa";

interface ActivitiesCardProps {
  imageUrl: string;
  name: string;
  type: string;
  breed: string;
  vetAppointment?: string;
  walkSchedule?: string;
  setActiveTab: (tab: string) => void; // 🔹 Nueva prop para cambiar el tab
}

const ActivitiesCard: React.FC<ActivitiesCardProps> = ({
  name,
  type,
  breed,
  vetAppointment,
  walkSchedule,
  setActiveTab, // 🔹 Recibimos setActiveTab
}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 2000);
  }, []);

  const handleCardClick = () => {
    setActiveTab("actividad"); // 🔹 Cambiamos a la pestaña de actividades
  };

  return (
    <div className="highlight-container-activities" onClick={handleCardClick}>
      <h2 className="highlight-title-activities">Próximas actividades</h2>

      {isLoading ? (
        <div className="skeleton-container-activities">
          <div className="skeleton skeleton-title-activities"></div>
          <div className="skeleton skeleton-subtext-activities"></div>
          <div className="skeleton skeleton-subtext-activities"></div>
          <div className="skeleton skeleton-activity"></div>
          <div className="skeleton skeleton-activity"></div>
        </div>
      ) : (
        <div className="highlight-card-activities">
          <aside className="pet-info-activities">
            <h3>{name}</h3>
            <p>
              <strong>{type}</strong>
            </p>
            <p>
              <strong>{breed}</strong>
            </p>

            <div className="activities-section">
              {vetAppointment && (
                <div className="activity">
                  <FaStethoscope className="icon-activities" />
                  <p>
                    <strong>Cita Veterinaria:</strong> {vetAppointment}
                  </p>
                </div>
              )}

              {walkSchedule && (
                <div className="activity">
                  <FaWalking className="icon-activities" />
                  <p>
                    <strong>Paseo Pendiente:</strong> {walkSchedule}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default ActivitiesCard;
