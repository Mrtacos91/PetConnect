import React, { useState } from "react";
import "../styles/BottomNav.css";
import { FaHome, FaComments, FaHeart } from "react-icons/fa";
import { PiGps } from "react-icons/pi";

interface BottomNavProps {
  setActiveTab: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ setActiveTab }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleItemClick = (index: number, tab: string) => {
    setActiveIndex(index);
    setActiveTab(tab);
  };

  return (
    <nav className="bottom-nav">
      <ul>
        {/* Indicador animado */}
        <div
          className="indicator"
          style={{
            left: `calc(${activeIndex * 25}% + 12px)`,
          }}
        />

        <li
          className={activeIndex === 0 ? "list active" : "list"}
          onClick={() => handleItemClick(0, "inicio")}
        >
          <FaHome />
          <span>Inicio</span>
        </li>
        <li
          className={activeIndex === 1 ? "list active" : "list"}
          onClick={() => handleItemClick(1, "actividad")}
        >
          <FaComments />
          <span>Actividad</span>
        </li>
        <li
          className={activeIndex === 2 ? "list active" : "list"}
          onClick={() => handleItemClick(2, "asistente")}
        >
          <FaHeart />
          <span>Asistente</span>
        </li>
        <li
          className={activeIndex === 3 ? "list active" : "list"}
          onClick={() => handleItemClick(3, "localizar")}
        >
          <PiGps />
          <span>Localizar</span>
        </li>
      </ul>
    </nav>
  );
};

export default BottomNav;
