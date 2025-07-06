import {
  FaPencilAlt,
  FaCheck,
  FaTimes,
  FaArrowLeft,
  FaArrowRight,
  FaPaw,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/Customise.css";
import "../styles/style.css";
import { useState, useEffect } from "react";
import BackButton from "../components/BackButton";
import {
  getCurrentUser,
  getLocalUserId,
  getAllPetsByUserId,
  uploadPetImage,
  savePetData,
  deletePet,
  PetData,
} from "../services/pet-service";

const Customise: React.FC = () => {
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petAge, setPetAge] = useState("");
  const [petPhoto, setPetPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [userPets, setUserPets] = useState<PetData[]>([]);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "error";
      message: string;
    }>
  >([]);

  // Cargar todas las mascotas del usuario
  const loadAllPets = async () => {
    const user = await getCurrentUser();
    if (!user) return;

    const localUserId = await getLocalUserId(user.email!);
    if (!localUserId) return;

    setUserId(localUserId);

    const pets = await getAllPetsByUserId(localUserId);
    setUserPets(pets);

    // Si hay mascotas, cargar la primera por defecto
    if (pets.length > 0) {
      loadPetData(pets[0]);
      setCurrentPetIndex(0);
    } else {
      // Si no hay mascotas, limpiar los campos
      clearPetForm();
    }
  };

  // Cargar datos de una mascota específica
  const loadPetData = (pet: PetData) => {
    setPetName(pet.pet_name || "");
    setPetType(pet.pet_type || "");
    setPetBreed(pet.pet_breed || "");
    setPetAge(pet.pet_age?.toString() || "");
    setCurrentImageUrl(pet.image_pet || null);
    setPhotoPreview(pet.image_pet || null);
  };

  // Limpiar el formulario para una nueva mascota
  const clearPetForm = () => {
    setPetName("");
    setPetType("");
    setPetBreed("");
    setPetAge("");
    setPetPhoto(null);
    setCurrentImageUrl(null);
    setPhotoPreview(null);
  };

  // Navegar a la mascota anterior
  const goToPreviousPet = () => {
    if (currentPetIndex > 0) {
      const newIndex = currentPetIndex - 1;
      setCurrentPetIndex(newIndex);
      loadPetData(userPets[newIndex]);
    }
  };

  // Navegar a la siguiente mascota o crear una nueva
  const goToNextPet = () => {
    if (currentPetIndex < userPets.length - 1) {
      // Si hay más mascotas, ir a la siguiente
      const newIndex = currentPetIndex + 1;
      setCurrentPetIndex(newIndex);
      loadPetData(userPets[newIndex]);
    } else if (userPets.length < 3) {
      // Si hay menos de 3 mascotas, permitir crear una nueva
      setCurrentPetIndex(userPets.length);
      clearPetForm();
    }
  };

  // Cargar datos al montar el componente y configurar el scroll
  useEffect(() => {
    loadAllPets();

    // Función para manejar el scroll
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 10) {
        document.body.classList.add("scrolling");
      } else {
        document.body.classList.remove("scrolling");
      }
    };

    // Agregar el event listener
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Limpiar el event listener al desmontar el componente
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Función para mostrar notificaciones
  // Función para manejar la eliminación de una mascota
  const handleDeletePet = async () => {
    if (!userPets[currentPetIndex]?.id) return;

    setDeleting(true);
    const petId = userPets[currentPetIndex].id!;

    try {
      const result = await deletePet(petId);

      if (result.success) {
        showNotification("success", "Mascota eliminada correctamente");
        // Recargar la lista de mascotas
        await loadAllPets();
        // Si no hay más mascotas, limpiar el formulario
        if (userPets.length <= 1) {
          clearPetForm();
        }
      } else {
        showNotification(
          "error",
          result.error || "Error al eliminar la mascota"
        );
      }
    } catch (error) {
      console.error("Error eliminando mascota:", error);
      showNotification("error", "Error inesperado al eliminar la mascota");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
    }, 5000);
  };

  // Función para cerrar una notificación específica
  const closeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  // Manejo de la imagen seleccionada
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPetPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Enviar el formulario para guardar la mascota
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!petName || !petType || !petBreed || !petAge) {
      showNotification("error", "Por favor, completa todos los campos.");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ OBTENER USUARIO DE SUPABASE AUTH
      const user = await getCurrentUser();
      if (!user) {
        showNotification(
          "error",
          "Debes iniciar sesión antes de agregar una mascota."
        );
        setLoading(false);
        return;
      }

      if (!userId) {
        showNotification(
          "error",
          "No se encontró tu usuario local. Verifica la tabla 'users'."
        );
        setLoading(false);
        return;
      }

      let imageUrl = currentImageUrl; // Usar la imagen existente por defecto

      // 2️⃣ MANEJAR LA IMAGEN EN SUPABASE STORAGE
      if (petPhoto) {
        imageUrl = await uploadPetImage(user.id, petPhoto, currentImageUrl);
        if (!imageUrl) {
          showNotification(
            "error",
            "Error procesando la imagen. Por favor, intenta de nuevo."
          );
          setLoading(false);
          return;
        }
      }

      // 3️⃣ PREPARAR Y GUARDAR LOS DATOS DE LA MASCOTA
      const petData: PetData = {
        user_id: userId,
        pet_name: petName,
        pet_type: petType,
        pet_breed: petBreed,
        pet_age: parseInt(petAge),
        image_pet: imageUrl,
      };

      // Si estamos editando una mascota existente, incluir su ID
      if (currentPetIndex < userPets.length && userPets[currentPetIndex]?.id) {
        petData.id = userPets[currentPetIndex].id;
      }

      // Guardar los datos usando la función del servicio
      const result = await savePetData(petData);

      if (!result.success) {
        console.error("Error guardando datos:", result.error);
        showNotification("error", "Error guardando los datos.");
      } else {
        showNotification("success", "¡Mascota guardada con éxito!");

        // Recargar las mascotas para actualizar la lista
        await loadAllPets();

        // Si era una mascota nueva, actualizar el índice actual
        if (currentPetIndex >= userPets.length) {
          setCurrentPetIndex(userPets.length);
        }
      }
    } catch (error) {
      console.error("Error en el proceso de guardado:", error);
      showNotification("error", "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customise-page">
      <div className="BackBt-CP">
        <BackButton />
      </div>
      <div>
        <ThemeToggle />
      </div>

      {/* Contenedor de notificaciones */}
      <div className="notification-container">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-item ${notification.type}`}
          >
            <div className="notification-content">
              <div className="notification-icon">
                {notification.type === "success" ? <FaCheck /> : <FaTimes />}
              </div>
              <div className="notification-text">{notification.message}</div>
            </div>
            <div
              className="notification-close"
              onClick={() => closeNotification(notification.id)}
            >
              <FaTimes />
            </div>
            <div className="notification-progress-bar"></div>
          </div>
        ))}
      </div>

      <main className="dashboard">
        <div className="customise-container">
          <div className="pet-navigation">
            <button
              type="button"
              className="pet-nav-btn"
              onClick={goToPreviousPet}
              disabled={currentPetIndex === 0}
            >
              <FaArrowLeft />
            </button>

            <div className="paw-indicators">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`paw-indicator ${
                    index < userPets.length ? "active" : ""
                  } ${index === currentPetIndex ? "current" : ""}`}
                  onClick={() => {
                    if (index < userPets.length) {
                      setCurrentPetIndex(index);
                      loadPetData(userPets[index]);
                    }
                  }}
                >
                  <FaPaw />
                </div>
              ))}
            </div>

            <button
              type="button"
              className="pet-nav-btn"
              onClick={goToNextPet}
              disabled={
                (currentPetIndex === userPets.length && userPets.length >= 3) ||
                (currentPetIndex === userPets.length - 1 &&
                  userPets.length === 3)
              }
            >
              <FaArrowRight />
            </button>
          </div>

          <div className="pet-slot-indicators">
            {[
              ...Array(
                Math.min(3, userPets.length + (userPets.length < 3 ? 1 : 0))
              ),
            ].map((_, index) => (
              <div
                key={index}
                className={`pet-slot ${
                  currentPetIndex === index ? "active" : ""
                }`}
                onClick={() => {
                  if (index < userPets.length) {
                    setCurrentPetIndex(index);
                    loadPetData(userPets[index]);
                  } else if (index === userPets.length) {
                    setCurrentPetIndex(index);
                    clearPetForm();
                  }
                }}
              >
                {index < userPets.length ? <FaPaw /> : <FaPlus />}
              </div>
            ))}
          </div>

          {/* Imagen de la mascota */}
          <div className="pet-photo-wrapper">
            <label htmlFor="petPhoto" className="pet-photo-label">
              <div className="pet-photo-circle">
                {photoPreview ? (
                  <img src={photoPreview} alt="Mascota" className="pet-photo" />
                ) : (
                  <span className="upload-text">📷</span>
                )}
                <div className="edit-icon-customise">
                  <FaPencilAlt />
                </div>
              </div>
            </label>
            <input
              type="file"
              id="petPhoto"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden-file-input"
            />
          </div>

          <form className="customise-form" onSubmit={handleSubmit}>
            <div className="form-group-customise">
              <input
                type="text"
                id="petName"
                className="form__field"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder=" "
                autoComplete="off"
                required
              />
              <label htmlFor="petName" className="form__label">
                Nombre
              </label>
            </div>

            <div className="form-group-customise">
              <input
                type="text"
                id="petType"
                className="form__field"
                value={petType}
                onChange={(e) => setPetType(e.target.value)}
                placeholder=" "
                autoComplete="off"
                required
              />
              <label htmlFor="petType" className="form__label">
                Tipo de mascota
              </label>
            </div>

            <div className="form-group-customise">
              <input
                type="text"
                id="petBreed"
                className="form__field"
                value={petBreed}
                onChange={(e) => setPetBreed(e.target.value)}
                placeholder=" "
                autoComplete="off"
              />
              <label htmlFor="petBreed" className="form__label">
                Raza
              </label>
            </div>

            <div className="form-group-customise">
              <input
                type="number"
                id="petAge"
                className="form__field"
                value={petAge}
                onChange={(e) => setPetAge(e.target.value)}
                placeholder=" "
                required
                min="0"
                max="30"
                step="0.5"
              />
              <label htmlFor="petAge" className="form__label">
                Edad (años)
              </label>
            </div>

            <div className="form-actions-customise">
              <button
                type="submit"
                className="save-button-pet"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>

              {currentPetIndex < userPets.length &&
                userPets[currentPetIndex]?.id && (
                  <button
                    type="button"
                    className="delete-pet-button"
                    onClick={() => setShowDeleteModal(true)}
                    disabled={loading}
                  >
                    <FaTrash /> Eliminar mascota
                  </button>
                )}
            </div>
          </form>
        </div>
      </main>

      {/* Modal de confirmación para eliminar mascota */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>¿Estás seguro que quieres eliminar esta mascota?</h3>
            <p>
              Esta acción no se puede deshacer y se eliminarán todos los datos
              de la mascota.
            </p>
            <div className="modal-buttons">
              <button
                className="cancel-button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="confirm-delete-button"
                onClick={handleDeletePet}
                disabled={deleting}
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customise;
