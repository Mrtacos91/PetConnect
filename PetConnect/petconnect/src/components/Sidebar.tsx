import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";
import supabase from "../supabase"; // Asegúrate de que supabase está bien configurado
import "../styles/Sidebar.css";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const navigate = useNavigate();
  const [logoSrc, setLogoSrc] = useState("");

  useEffect(() => {
    // Obtener el valor de la variable CSS --logo
    const rootStyles = getComputedStyle(document.documentElement);
    const logoUrl = rootStyles.getPropertyValue("--logo").trim().slice(5, -2); // Eliminar 'url("")'
    setLogoSrc(logoUrl);
  }, []);

  // 🔹 Función para cerrar sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login"); // Redirige al login después de cerrar sesión
  };

  return (
    <div className={`sidebar-container ${isOpen ? "open" : ""}`}>
      <nav className="sidebar">
        <div className="logo">
          <img src={logoSrc} />
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
          {/* 🔹 Botón de Cerrar Sesión */}
          <li className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt className="icon-side" />
            Cerrar sesión
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
