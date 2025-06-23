import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaCog, FaSignOutAlt, FaPaw } from "react-icons/fa";
import supabase from "../supabase";
import "../styles/Sidebar.css";
import SocialMedia from "../components/SocialMedia";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Verificar el tema inicial
    const checkTheme = () => {
      const theme = localStorage.getItem("theme");
      setIsDarkMode(theme === "dark");
    };

    // Verificar el tema cuando el componente se monta
    checkTheme();

    // Configurar un observador para detectar cambios en el tema
    const observer = new MutationObserver(() => {
      checkTheme();
    });

    // Observar cambios en las clases del body
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Limpiar el observador cuando el componente se desmonta
    return () => observer.disconnect();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className={`sidebar-container ${isOpen ? "sidebar-open" : ""}`}>
      <nav className="sidebar-nav">
        <div className="sidebar-logo">
          <img
            src={
              isDarkMode
                ? "/images/Logo_gradient.png"
                : "/images/Logo_black.png"
            }
            alt="PetConnect Logo"
            className="sidebar-logo-img"
          />
        </div>
        <ul className="sidebar-menu">
          <li
            className="sidebar-menu-item"
            onClick={() => navigate("/Micuenta")}
          >
            <div className="sidebar-menu-link">
              <FaUser className="sidebar-icon" />
              <span className="sidebar-link-text">Mi cuenta</span>
            </div>
          </li>
          <li
            className="sidebar-menu-item"
            onClick={() => navigate("/customise")}
          >
            <div className="sidebar-menu-link">
              <FaPaw className="sidebar-icon" />
              <span className="sidebar-link-text">Mis mascotas</span>
            </div>
          </li>
          <li className="sidebar-menu-item" onClick={() => navigate("/config")}>
            <div className="sidebar-menu-link">
              <FaCog className="sidebar-icon" />
              <span className="sidebar-link-text">Configuración</span>
            </div>
          </li>
          <li
            className="sidebar-menu-item sidebar-logout"
            onClick={handleLogout}
          >
            <div className="sidebar-menu-link">
              <FaSignOutAlt className="sidebar-icon" />
              <span className="sidebar-link-text">Cerrar sesión</span>
            </div>
          </li>
        </ul>
        <div className="sidebar-social">
          <SocialMedia />
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
