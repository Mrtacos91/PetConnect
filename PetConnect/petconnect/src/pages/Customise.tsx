import { useNavigate } from "react-router-dom";
import { FaPencilAlt, FaCheck, FaTimes } from "react-icons/fa";
import supabase from "../supabase"; // Importa tu cliente de Supabase
import Sidebar from "../components/Sidebar";
import MenuButton from "../components/MenuButton";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/Customise.css";
import "../styles/style.css"; // Importamos los estilos de notificación
import { useState, useEffect } from "react";

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

  // Cargar datos existentes al montar el componente
  const loadExistingPetData = async () => {
    const { data: sessionData } = await supabase.auth.getUser();
    if (!sessionData?.user) return;

    const { data: localUser } = await supabase
      .from("Users")
      .select("id")
      .eq("email", sessionData.user.email)
      .single();

    if (!localUser?.id) return;

    const { data: existingPet } = await supabase
      .from("Pets")
      .select("*")
      .eq("user_id", localUser.id)
      .single();

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

  const handleBack = () => {
    navigate("/dashboard");
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

    // 1️⃣ OBTENER USUARIO DE SUPABASE AUTH
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !sessionData?.user) {
      showNotification(
        "error",
        "Debes iniciar sesión antes de agregar una mascota."
      );
      setLoading(false);
      return;
    }
    const supabaseEmail = sessionData.user.email;

    // 2️⃣ BUSCAR ID LOCAL EN TABLA "users"
    const { data: localUser, error: localUserError } = await supabase
      .from("Users")
      .select("id")
      .eq("email", supabaseEmail)
      .single();

    if (localUserError || !localUser?.id) {
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
      try {
        // Si hay una imagen anterior, intentar borrarla primero
        if (currentImageUrl) {
          const oldPath = currentImageUrl.split("/").slice(-2).join("/"); // Obtener "userId/filename"
          const { error: deleteError } = await supabase.storage
            .from("petimage")
            .remove([oldPath]);

          if (deleteError) {
            console.error("Error borrando la imagen anterior:", deleteError);
            // Continuamos con la subida aunque falle el borrado
          }
        }

        // Preparar la nueva imagen
        const fileExt = petPhoto.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${sessionData.user.id}/${fileName}`;

        // Subir la nueva imagen
        const { error: uploadError } = await supabase.storage
          .from("petimage")
          .upload(filePath, petPhoto);

        if (uploadError) {
          throw new Error(`Error subiendo la imagen: ${uploadError.message}`);
        }

        // Obtener la URL pública
        const { data: publicUrlData } = await supabase.storage
          .from("petimage")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      } catch (error) {
        console.error("Error en el proceso de imagen:", error);
        showNotification(
          "error",
          "Error procesando la imagen. Por favor, intenta de nuevo."
        );
        setLoading(false);
        return;
      }
    }

    // 4️⃣ BUSCAR SI YA EXISTE UNA MASCOTA PARA ESTE USUARIO
    const { data: existingPet } = await supabase
      .from("Pets")
      .select("id")
      .eq("user_id", localUser.id)
      .single();

    // INSERTAR O ACTUALIZAR DATOS EN LA TABLA "pets"
    const { error: upsertError } = await supabase.from("Pets").upsert([
      {
        id: existingPet?.id, // Si existe, actualizará el registro existente
        user_id: localUser.id,
        pet_name: petName,
        pet_type: petType,
        pet_breed: petBreed,
        pet_age: parseInt(petAge),
        image_pet: imageUrl,
      },
    ]);

    if (upsertError) {
      console.error("Error actualizando datos en Supabase:", upsertError);
      showNotification("error", "Error guardando los datos.");
    } else {
      showNotification("success", "¡Mascota guardada con éxito!");
      // Redirigir después de mostrar la notificación
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    }

    setLoading(false);
  };

  return (
    <div className="customise-page">
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

      <button
        className="back-button"
        onClick={handleBack}
        aria-label="Volver al dashboard"
      >
        ←
      </button>

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
