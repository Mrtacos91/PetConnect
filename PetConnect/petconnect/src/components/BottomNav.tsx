import React, { useState } from "react";
import "../styles/BottomNav.css";
import { FaHome, FaComments, FaHeart } from "react-icons/fa";
import { PiGps } from "react-icons/pi";

const BottomNav: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleItemClick = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <nav className="bottom-nav">
      <ul>
        {/* Indicador animado corregido */}
        <div
          className="indicator"
          style={{
            left: `calc(${activeIndex * 25}% + 12px)`, // Corrección de posición
          }}
        />

        <li
          className={activeIndex === 0 ? "list active" : "list"}
          onClick={() => handleItemClick(0)}
        >
          <FaHome />
          <span>Inicio</span>
        </li>
        <li
          className={activeIndex === 1 ? "list active" : "list"}
          onClick={() => handleItemClick(1)}
        >
          <FaComments />
          <span>Actividad</span>
        </li>
        <li
          className={activeIndex === 2 ? "list active" : "list"}
          onClick={() => handleItemClick(2)}
        >
          <FaHeart />
          <span>Asistente</span>
        </li>
        <li
          className={activeIndex === 3 ? "list active" : "list"}
          onClick={() => handleItemClick(3)}
        >
          <PiGps />
          <span>Localizar</span>
        </li>
      </ul>
    </nav>
  );
};

export default BottomNav;
