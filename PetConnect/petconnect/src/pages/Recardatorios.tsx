import React, { useState, useEffect } from "react";
import BackButton from "../components/BackButton";
import Paseos from "../components/Paseos";
import Foods from "../components/Foods";
import "../styles/foods.css";
import "../styles/Paseos.css";
import "../styles/style.css";
import "../styles/Recordatorios.css";

const Recardatorios: React.FC = () => {
  const [, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    // Registrar el tiempo de inicio para asegurar un mínimo de 2 segundos
    const startTime = Date.now();

    // Simulate loading data
    const loadData = async () => {
      // Simular carga de datos
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Calcular cuánto tiempo ha pasado
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 2000 - elapsedTime);

      // Si ha pasado menos de 2 segundos, esperar el tiempo restante
      setTimeout(() => {
        setIsLoading(false);
        setShowSkeleton(false);
      }, remainingTime);
    };

    loadData();

    return () => {};
  }, []);

  return (
    <div className="recordatorios-root">
      <BackButton route="/dashboard" />
      <div className="recordatorios-header">
        <div className="recordatorios-header-left">
          <div className="Back-bt"></div>
        </div>
        <div className="recordatorios-header-right"></div>
      </div>
      <h1 className="recordatorios-title">Recordatorios</h1>

      {showSkeleton ? (
        <div className="recordatorios-skeleton">
          <div className="recordatorios-skeleton-module"></div>
          <div className="recordatorios-skeleton-module"></div>
        </div>
      ) : (
        <div className="recordatorios-modules">
          <Paseos />
          <Foods />
        </div>
      )}
    </div>
  );
};

export default Recardatorios;
