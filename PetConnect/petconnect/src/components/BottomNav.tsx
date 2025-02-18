import React from "react";
import "../styles/BottomNav.css";
import { FaHome, FaComments, FaHeart } from "react-icons/fa";
import { PiGps } from "react-icons/pi";

const BottomNav: React.FC = () => {
  return (
    <nav className="bottom-nav">
      <ul>
        <li>
          <FaHome />
          <span>Inicio</span>
        </li>
        <li>
          <FaComments />
          <span>Actividad</span>
        </li>
        <li>
          <FaHeart />
          <span>Asistente</span>
        </li>
        <li>
          <PiGps />
          <span>Localizar</span>
        </li>
      </ul>
    </nav>
  );
};

export default BottomNav;
