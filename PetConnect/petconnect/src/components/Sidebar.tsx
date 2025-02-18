import React from "react";
import { FaUser, FaCog } from "react-icons/fa";
import "../styles/Sidebar.css";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  return (
    <div className={`sidebar-container ${isOpen ? "open" : ""}`}>
      <nav className="sidebar">
        <div className="logo">
          <img src="/images/Logo_black.png" alt="PetConnect" />
        </div>
        <ul>
          <li>
            <FaUser className="icon" />
            Mi cuenta
          </li>
          <li>
            <FaCog className="icon" />
            Configuración
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
