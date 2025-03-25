import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";
import supabase from "../supabase";
import "../styles/Sidebar.css";
import SocialMedia from "../components/SocialMedia";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className={`sidebar-container ${isOpen ? "open" : ""}`}>
      <nav className="sidebar">
        <div className="logo">
          <img src="/images/Logo_gradient.png" alt="PetConnect Logo" />
        </div>
        <ul>
          <li>
            <FaUser className="icon-side" />
            Mi cuenta
          </li>
          <li>
            <FaCog className="icon-side" />
            Configuración
          </li>
          <li className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt className="icon-side" />
            Cerrar sesión
          </li>
        </ul>
      </nav>
      <SocialMedia />
    </div>
  );
};

export default Sidebar;
