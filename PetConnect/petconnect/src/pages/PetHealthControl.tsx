import React from "react";
import Actividades from "../components/Actividades";
import TrackingMedico from "../components/TrackingMedico";
import BackButton from "../components/BackButton";
import "../styles/PetHealthControl.css";

const PetHealthControl: React.FC = () => {
  return (
    <div className="health-page-wrapper">
      <div className="health-backbtn-top">
        <BackButton />
      </div>
      <div className="health-container">
        <div className="health-dashboard">
          <h2 className="health-dashboard-title">Dashboard de Salud y Actividad</h2>
          {/* Aquí iría una gráfica real, por ahora un placeholder */}
          <div className="health-graph-placeholder">
            <span>Gráfica de Actividad y Salud (próximamente)</span>
          </div>
        </div>
        <div className="health-item1">
          <Actividades />
        </div>
        <div className="health-item2">
          <TrackingMedico />
        </div>
      </div>
    </div>
  );
};

export default PetHealthControl;
