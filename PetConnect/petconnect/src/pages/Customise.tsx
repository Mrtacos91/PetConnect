import { useNavigate } from "react-router-dom";
import { FaPencilAlt, FaCheck, FaTimes } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import MenuButton from "../components/MenuButton";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/Customise.css";
import "../styles/style.css"; 
import { useState, useEffect } from "react";
import BackButton from "../components/BackButton";
import { getCurrentUser, getLocalUserId, getPetByUserId, uploadPetImage, savePetData, PetData } from "../services/pet-service";

const Customise: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petAge, setPetAge] = useState("");
  const [petPhoto, setPetPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "error";
      message: string;
    }>
  >([]);

  const navigate = useNavigate();
  
  const loadExistingPetData = async () => {
    const user = await getCurrentUser();
    if (!user) return;

    const userId = await getLocalUserId(user.email!);
    if (!userId) return;

    const existingPet = await getPetByUserId(userId);

    if (existingPet) {
      setPetName(existingPet.pet_name || "");
      setPetType(existingPet.pet_type || "");
      setPetBreed(existingPet.pet_breed || "");
      setPetAge(existingPet.pet_age?.toString() || "");
      setCurrentImageUrl(existingPet.image_pet);
      setPhotoPreview(existingPet.image_pet);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadExistingPetData();
  }, []);

  // Función para mostrar notificaciones
  const showNotification = (type: "success" | "error", message: string) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);

    // Eliminar la notificación después de 5 segundos
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
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

      // 2️⃣ BUSCAR ID LOCAL EN TABLA "users"
      const userId = await getLocalUserId(user.email!);
      if (!userId) {
        showNotification(
          "error",
          "No se encontró tu usuario local. Verifica la tabla 'users'."
        );
        setLoading(false);
        return;
      }

      let imageUrl = currentImageUrl; // Usar la imagen existente por defecto

      // 3️⃣ MANEJAR LA IMAGEN EN SUPABASE STORAGE
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

      // 4️⃣ PREPARAR Y GUARDAR LOS DATOS DE LA MASCOTA
      const petData: PetData = {
        user_id: userId,
        pet_name: petName,
        pet_type: petType,
        pet_breed: petBreed,
        pet_age: parseInt(petAge),
        image_pet: imageUrl,
      };

      // Obtener el ID de la mascota existente si hay una
      const existingPet = await getPetByUserId(userId);
      if (existingPet?.id) {
        petData.id = existingPet.id;
      }

      // Guardar los datos usando la función del servicio
      const result = await savePetData(petData);

      if (!result.success) {
        console.error("Error guardando datos:", result.error);
        showNotification("error", "Error guardando los datos.");
      } else {
        showNotification("success", "¡Mascota guardada con éxito!");
        // Redirigir después de mostrar la notificación
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
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
      <BackButton/>
      </div>
      <ThemeToggle />
      <MenuButton isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} />

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
          <h1>Personaliza tu mascota</h1>

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
            <div className="form-group">
              <label htmlFor="petName">Nombre</label>
              <input
                type="text"
                id="petName"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Nuevo nombre"
                autoComplete="off"
              />
            </div>

            <div className="form-group-type">
              <label htmlFor="petType">Tipo de Mascota</label>
              <select
                id="petType"
                value={petType}
                onChange={(e) => setPetType(e.target.value)}
              >
                <option value="">Selecciona un tipo</option>
                <option value="Perro">Perro</option>
                <option value="Gato">Gato</option>
                <option value="Ave">Ave</option>
                <option value="Roedor">Roedor</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="petBreed">Raza</label>
              <input
                type="text"
                id="petBreed"
                value={petBreed}
                onChange={(e) => setPetBreed(e.target.value)}
                placeholder="Nueva raza"
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="petAge">Edad</label>
              <input
                type="number"
                id="petAge"
                value={petAge}
                onChange={(e) => setPetAge(e.target.value)}
                placeholder="Edad en años"
              />
            </div>

            <button type="submit" className="save-button" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Customise;
