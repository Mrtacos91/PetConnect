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
    <div className={`sidebar-container ${isOpen ? "open" : ""}`}>
      <nav className="sidebar">
        <div className="logo">
          <img
            src={
              isDarkMode
                ? "/images/Logo_gradient.png"
                : "/images/Logo_black.png"
            }
            alt="PetConnect Logo"
          />
        </div>
        <ul>
          <li>
            <div className="container-myaccount">
              <FaUser className="icon-side" />
              Mi cuenta
            </div>
          </li>
          <li>
            <div className="container-pets">
              <FaPaw className="icon-side" />
              Mis mascotas
            </div>
          </li>
          <li>
            <div className="container-config">
              <FaCog className="icon-side" />
              Configuración
            </div>
          </li>

          <li className="logout-btn" onClick={handleLogout}>
            <div className="container-logout">
              <FaSignOutAlt className="icon-side" />
              Cerrar sesión
            </div>
          </li>
        </ul>
      </nav>
      <SocialMedia />
    </div>
  );
};

export default Sidebar;
