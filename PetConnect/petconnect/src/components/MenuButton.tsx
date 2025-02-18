import React from "react";
import { FaBars } from "react-icons/fa"; // Ícono de menú
import "../styles/MenuButton.css";

interface MenuButtonProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({ isOpen, toggleSidebar }) => {
  return (
    <button
      className={`menu-button ${isOpen ? "rotate" : ""}`}
      onClick={toggleSidebar}
    >
      <FaBars />
    </button>
  );
};

export default MenuButton;
