import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/BackButton.css";

interface BackButtonProps {
  route?: string;
  text?: string;
  className?: string;
  style?: React.CSSProperties;
  position?: "absolute" | "relative" | "fixed";
  top?: string;
  left?: string;
  zIndex?: number;
}

const BackButton: React.FC<BackButtonProps> = ({
  route,
  text = "Volver",
  className = "",
  style = {},
  position,
  top,
  left,
  zIndex,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (route) {
      navigate(route);
    } else {
      navigate(-1);
    }
  };

  // Crear estilos personalizados para el contenedor si se proporcionan props de posición
  const containerStyle: React.CSSProperties = {
    position: position || "absolute",
    top: top,
    left: left,
    zIndex: zIndex,
    ...style,
  };

  return (
    <div className="back-button-container" style={containerStyle}>
      <button className={`backBT ${className}`} onClick={handleClick}>
        <span className="backBT-content">{text}</span>
      </button>
    </div>
  );
};

export default BackButton;
