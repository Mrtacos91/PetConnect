import React from "react";
import "../styles/MenuButton.css";

interface MenuButtonProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({ isOpen, toggleSidebar }) => {
  return (
    <label className="hamburger menu-button">
      <input type="checkbox" checked={isOpen} onChange={toggleSidebar} />
      <svg viewBox="0 0 32 32">
        <path className="line line-top-bottom" d="M27 10 L5 10 C3.5 10 2 11.5 2 13 L2 13 C2 14.5 3.5 16 5 16 L27 16 C28.5 16 30 14.5 30 13 L30 13 C30 11.5 28.5 10 27 10 Z" />
        <path className="line" d="M27 16 L5 16 C3.5 16 2 17.5 2 19 L2 19 C2 20.5 3.5 22 5 22 L27 22 C28.5 22 30 20.5 30 19 L30 19 C30 17.5 28.5 16 27 16 Z" />
        <path className="line line-top-bottom" d="M27 22 L5 22 C3.5 22 2 23.5 2 25 L2 25 C2 26.5 3.5 28 5 28 L27 28 C28.5 28 30 26.5 30 25 L30 25 C30 23.5 28.5 22 27 22 Z" />
      </svg>
    </label>
  );
};

export default MenuButton;
