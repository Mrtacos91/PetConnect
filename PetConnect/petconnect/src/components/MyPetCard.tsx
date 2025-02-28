import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Redirección
import { FaEdit } from "react-icons/fa"; // Ícono de edición
import "../styles/MyPet.css";

interface MyPetCardProps {
  imageUrl: string;
  name: string;
  type: string;
  breed: string;
}

const HighlightCard: React.FC<MyPetCardProps> = ({
  imageUrl,
  name,
  type,
  breed,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false); // Estado para mostrar "Editar"
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 2000); // Simula el tiempo de carga
  }, []);

  return (
    <div
      className="highlight-container-MyPet"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h2 className="highlight-title-MyPet">Mi mascota</h2>

      {/* 🔹 Botón "Editar" que aparece al pasar el mouse */}
      {isHovered && (
        <button
          className="edit-button-MyPet"
          onClick={() => navigate("/customise")}
        >
          <FaEdit className="edit-icon" /> Editar
        </button>
      )}

      {isLoading ? (
        // 🔹 Skeleton Loader
        <div className="skeleton-container-MyPet">
          <div className="skeleton skeleton-image-MyPet"></div>
          <div className="skeleton-text-MyPet">
            <div className="skeleton skeleton-title-MyPet"></div>
            <div className="skeleton skeleton-subtext-MyPet"></div>
            <div className="skeleton skeleton-subtext-MyPet"></div>
          </div>
        </div>
      ) : (
        // 🔹 Contenido real
        <div className="highlight-card-MyPet">
          {/* Botón "Editar" posicionado dentro de la tarjeta */}
          {isHovered && (
            <button
              className="edit-button-MyPet"
              onClick={() => navigate("/Customise")}
            >
              <FaEdit className="edit-icon" /> Editar
            </button>
          )}
          <img src={imageUrl} alt={name} className="pet-image-MyPet" />
          <aside className="pet-info-MyPet">
            <h3>{name}</h3>
            <p>
              <strong>{type}</strong>
            </p>
            <p>
              <strong>{breed}</strong>
            </p>
          </aside>
        </div>
      )}
    </div>
  );
};

export default HighlightCard;
