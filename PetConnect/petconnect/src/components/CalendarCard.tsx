import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCalendarAlt } from "react-icons/fa";
import "../styles/CalendarCard.css";

const CalendarCard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleViewCalendar = () => {
    navigate("/calendar");
  };

  if (isLoading) {
    return (
      <div className="calendar-card-container">
        <div className="calendar-card skeleton">
          <div className="calendar-card-content">
            <div className="skeleton-icon"></div>
            <div className="skeleton-title"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-button"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-card-container">
      <div className="calendar-card">
        <div className="calendar-card-content">
          <div className="calendar-card-icon">
            <FaCalendarAlt />
          </div>
          <h2 className="calendar-card-title">Calendario de Actividades</h2>
          <p className="calendar-card-description">
            Organiza y visualiza todas tus actividades y eventos importantes
            para tu mascota en un solo lugar.
          </p>
          <button className="calendar-card-button" onClick={handleViewCalendar}>
            <span>Ver Calendario</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarCard;
