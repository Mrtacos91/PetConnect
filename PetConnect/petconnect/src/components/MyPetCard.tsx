import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit } from "react-icons/fa";
import "../styles/MyPet.css";
import {
  getAllPetsByUserId,
  getLocalUserId,
  getCurrentUser,
  PetData,
} from "../services/pet-service";

interface MyPetCardProps {
  imageUrl: string;
  name: string;
  type: string;
  breed: string;
}

const MyPetCard: React.FC<MyPetCardProps> = ({
  imageUrl,
  name,
  type,
  breed,
}) => {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pets, setPets] = useState<PetData[]>([]);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const petContentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Cargar mascotas del usuario
  const loadUserPets = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const userId = await getLocalUserId(user.email!);
      if (!userId) {
        // Si no hay usuario local, usar los props pasados
        setPets([
          {
            id: "default",
            image_pet: imageUrl,
            pet_name: name,
            pet_type: type,
            pet_breed: breed,
            pet_age: 0, // Default age
            user_id: "default",
          },
        ]);
        return;
      }

      const userPets = await getAllPetsByUserId(userId);
      if (userPets.length === 0) {
        // Si no hay mascotas, usar los props pasados
        setPets([
          {
            id: "default",
            image_pet: imageUrl,
            pet_name: name,
            pet_type: type,
            pet_breed: breed,
            pet_age: 0, // Default age
            user_id: userId,
          },
        ]);
      } else {
        setPets(userPets);
      }
    } catch (error) {
      console.error("Error cargando mascotas:", error);
      // En caso de error, usar los props pasados
      setPets([
        {
          id: "default",
          image_pet: imageUrl,
          pet_name: name,
          pet_type: type,
          pet_breed: breed,
          pet_age: 0, // Default age
          user_id: "error",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [imageUrl, name, type, breed]);

  // Navegación con transición de paneo horizontal
  const changePet = useCallback(
    (newIndex: number) => {
      if (pets.length <= 1 || isTransitioning || newIndex === currentPetIndex)
        return;

      setIsTransitioning(true);
      const contentRef = petContentRef.current;
      if (!contentRef) return;

      // Determinar la dirección del paneo
      const direction = newIndex > currentPetIndex ? "right" : "left";

      // Aplicar clase CSS en lugar de estilos en línea
      contentRef.className = `pet-content slide-exit-${direction}`;

      // Cambiar el índice después de completar la animación de salida
      setTimeout(() => {
        setCurrentPetIndex(newIndex);

        // Aplicar clase de entrada
        contentRef.className = `pet-content slide-enter-${
          direction === "right" ? "left" : "right"
        }`;

        // Completar la animación de entrada
        setTimeout(() => {
          contentRef.className = "pet-content pet-content-active";

          // Restablecer el estado de transición
          setTimeout(() => {
            setIsTransitioning(false);
          }, 100);
        }, 50);
      }, 300);
    },
    [currentPetIndex, isTransitioning, pets.length]
  );

  // Cargar mascotas al montar el componente
  useEffect(() => {
    loadUserPets();
  }, [loadUserPets]);

  // Auto-rotación cada 5 segundos
  useEffect(() => {
    if (pets.length <= 1) return;

    const interval = setInterval(() => {
      const newIndex = (currentPetIndex + 1) % pets.length;
      changePet(newIndex);
    }, 5000);

    return () => clearInterval(interval);
  }, [pets.length, currentPetIndex, changePet]);

  // Manejadores para el swipe en móviles
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (pets.length <= 1 || isTransitioning) return;
      setTouchStartX(e.touches[0].clientX);
      setTouchStartY(e.touches[0].clientY);
    },
    [pets.length, isTransitioning]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (
        touchStartX === null ||
        touchStartY === null ||
        pets.length <= 1 ||
        isTransitioning
      ) {
        setTouchStartX(null);
        setTouchStartY(null);
        return;
      }

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      const minSwipeDistance = 50; // Distancia mínima para un swipe

      // Priorizar swipe horizontal sobre scroll vertical
      if (
        Math.abs(deltaX) > minSwipeDistance &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.5
      ) {
        if (deltaX > 0) {
          // Swipe de izquierda a derecha -> Siguiente mascota (según solicitud del usuario)
          const newIndex = (currentPetIndex + 1) % pets.length;
          changePet(newIndex);
        } else {
          // Swipe de derecha a izquierda -> Mascota anterior
          const newIndex = (currentPetIndex - 1 + pets.length) % pets.length;
          changePet(newIndex);
        }
      }

      // Resetear coordenadas
      setTouchStartX(null);
      setTouchStartY(null);
    },
    [
      touchStartX,
      touchStartY,
      pets.length,
      isTransitioning,
      currentPetIndex,
      changePet,
    ]
  );

  // Si no hay mascotas
  if (!isLoading && pets.length === 0) {
    return (
      <div className="highlight-container-MyPet">
        <h2 className="highlight-title-MyPet">No hay mascotas</h2>
        <button
          className="add-pet-button"
          onClick={() => navigate("/customise")}
        >
          Agregar mascota
        </button>
      </div>
    );
  }

  const currentPet = pets[currentPetIndex] || {
    id: "default",
    image_pet: imageUrl,
    pet_name: name,
    pet_type: type,
    pet_breed: breed,
    pet_age: 0, // Default age
    user_id: "default",
  };

  const { image_pet, pet_name, pet_type, pet_breed, id } = currentPet;

  return (
    <div className="highlight-container-MyPet">
      <h2 className="highlight-title-MyPet">
        {pets.length > 1 ? "Mis mascotas" : "Mi mascota"}
      </h2>

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
        <div className="highlight-card-MyPet">
          <div
            className="pet-carousel"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="pet-content pet-content-active" ref={petContentRef}>
              <button
                className="edit-button-MyPet"
                onClick={() => navigate(`/customise?petId=${id}`)}
                aria-label="Editar mascota"
              >
                <FaEdit className="edit-icon" />
              </button>
              <img
                src={image_pet || ""}
                alt={pet_name || "Imagen de mascota"}
                className="pet-image-MyPet"
                loading="lazy"
              />
              <aside className="pet-info-MyPet">
                <h3>{pet_name}</h3>
                <p>
                  <strong>{pet_type}</strong>
                </p>
                <p>
                  <strong>{pet_breed}</strong>
                </p>
              </aside>
            </div>
          </div>

          {pets.length > 1 && (
            <div className="carousel-indicators">
              {pets.map((_, index) => (
                <button
                  key={index}
                  className={`indicator-MyPet ${
                    index === currentPetIndex ? "active" : ""
                  }`}
                  onClick={() => changePet(index)}
                  aria-label={`Ver mascota ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyPetCard;
