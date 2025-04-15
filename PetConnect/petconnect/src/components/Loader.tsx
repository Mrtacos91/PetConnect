import React from "react";
import "../styles/Loader.css";

interface LoaderProps {
  size?: "small" | "medium" | "large";
  color?: string;
}

const Loader: React.FC<LoaderProps> = ({ size = "medium", color }) => {
  const sizeClass = `paw-loader-${size}`;
  const colorStyle = color
    ? ({ "--paw-color": color } as React.CSSProperties)
    : {};

  return (
    <div className="paw-loader-container">
      <div className={`paw-loader ${sizeClass}`} style={colorStyle}>
        <div className="paw-main-pad"></div>
        <div className="paw-pad paw-pad-1"></div>
        <div className="paw-pad paw-pad-2"></div>
        <div className="paw-pad paw-pad-3"></div>
        <div className="paw-pad paw-pad-4"></div>
      </div>
      <p className="paw-loader-text">Cargando...</p>
    </div>
  );
};

export default Loader;
