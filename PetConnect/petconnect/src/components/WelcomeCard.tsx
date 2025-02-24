import React from "react";
import "../styles/WelcomeCard.css";

interface WelcomeCardProps {
  username?: string; // Opcional, para personalizar el saludo
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ username }) => {
  return (
    <div className="welcome-card">
      <h1 className="welcome-text">¡Hola, {username || "Usuario"}! 👋</h1>
      <p className="welcome-subtext">Bienvenido a PetConnect</p>
    </div>
  );
};

export default WelcomeCard;
