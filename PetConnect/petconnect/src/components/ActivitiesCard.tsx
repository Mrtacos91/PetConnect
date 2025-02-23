import React from "react";
import "../styles/ActivitiesCard.css";
import { FaStethoscope, FaWalking } from "react-icons/fa";

interface ActivitiesCardProps {
  imageUrl: string;
  name: string;
  type: string;
  breed: string;
  vetAppointment?: string; // Fecha de la cita con el veterinario
  walkSchedule?: string; // Fecha y hora del paseo
}

const ActivitiesCard: React.FC<ActivitiesCardProps> = ({
  name,
  type,
  breed,
  vetAppointment,
  walkSchedule,
}) => {
  return (
    <div className="highlight-container-activities">
      <h2 className="highlight-title-activities">Próximas actividades</h2>
      <div className="highlight-card-activities">
        {/* Información de la mascota */}
        <aside className="pet-info-activities">
          <h3>{name}</h3>
          <p>
            <strong>{type}</strong>
          </p>
          <p>
            <strong>{breed}</strong>
          </p>

          {/* 📌 Sección de Actividades */}
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
    </div>
  );
};

export default ActivitiesCard;
