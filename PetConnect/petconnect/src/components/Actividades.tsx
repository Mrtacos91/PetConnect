import { useState, useEffect } from "react";
import "../styles/Actividades.css";
import "../styles/style.css";
import supabase from "../supabase";
import { useNavigate } from "react-router-dom";
import { getAllPetsByUserId, PetData } from "../services/pet-service";

const Actividades = () => {
  const navigate = useNavigate();
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [fechaCita, setFechaCita] = useState("");
  const [horaCita, setHoraCita] = useState("");
  const [nombreCita, setNombreCita] = useState("");
  const [petName, setPetName] = useState(""); // Estado para el nombre de la mascota seleccionada
  const [userPets, setUserPets] = useState<PetData[]>([]); // Estado para almacenar las mascotas del usuario
  const [editingId, setEditingId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [citas, setCitas] = useState<
    { id: number; user_id: number; Name: string; Date: string; Time: string; petname?: string }[]
  >([]);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000); // Ajustado a 5 segundos para coincidir con la animación
  };

  // Función para cargar las mascotas del usuario
  const loadUserPets = async (userId: string) => {
    try {
      const pets = await getAllPetsByUserId(userId);
      setUserPets(pets);
    } catch (error) {
      console.error("Error al cargar las mascotas del usuario:", error);
      showNotification("No se pudieron cargar las mascotas.", "error");
    }
  };

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const checkUser = async () => {
      // 1️⃣ OBTENER USUARIO DE SUPABASE AUTH
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getUser();

      if (sessionError || !sessionData?.user) {
        console.error("Error de sesión:", sessionError);
        navigate("/login");
        return;
      }

      try {
        // 2️⃣ BUSCAR ID LOCAL EN TABLA "Users"
        const { data: localUser, error: localUserError } = await supabase
          .from("Users")
          .select("id")
          .eq("email", sessionData.user.email)
          .single();

        if (localUserError || !localUser?.id) {
          console.error("Error al obtener el usuario local:", localUserError);
          showNotification(
            "No se encontró tu usuario local. Verifica la tabla 'Users'.",
            "error"
          );
          setIsLoading(false);
          return;
        }

        if (!localUser || !localUser.id) {
          console.error("No se encontró el usuario local");
          showNotification("No se encontró el usuario local", "error");
          setIsLoading(false);
          return;
        }

        // Establecer el ID del usuario
        const userId = localUser.id;
        setUserId(userId);
        console.log("ID del usuario local:", userId);

        // Cargar las mascotas del usuario
        await loadUserPets(userId);

        // Cargar las citas del usuario
        fetchEvents(userId);
      } catch (e) {
        console.error("Error al identificar el usuario:", e);
        showNotification("Error al identificar el usuario", "error");
        setIsLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  // Función para obtener las citas desde la base de datos
  const fetchEvents = async (userIdParam: number) => {
    // Registrar el tiempo de inicio para asegurar un mínimo de 2 segundos
    const startTime = Date.now();

    try {
      if (!userIdParam) {
        showNotification("No hay usuario autenticado", "error");
        return;
      }

      console.log("Buscando eventos para el usuario ID:", userIdParam);

      // Consultar eventos para el usuario actual
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", userIdParam);

      if (error) {
        console.error("Error al consultar eventos:", error);
        throw error;
      }

      console.log("Eventos encontrados:", data?.length || 0);
      setCitas(data || []);
    } catch (error) {
      console.error("Error al cargar eventos:", error);
      showNotification("No se pudieron cargar las citas.", "error");
    } finally {
      // Calcular cuánto tiempo ha pasado
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 2000 - elapsedTime);

      // Si ha pasado menos de 2 segundos, esperar el tiempo restante
      setTimeout(() => {
        setIsLoading(false);
        setShowSkeleton(false);
      }, remainingTime);
    }
  };

  // Función para agendar la cita
  const handleAgendarCita = async () => {
    // Validar si se seleccionó fecha, hora y nombre de la cita
    if (!fechaCita) {
      showNotification("Por favor, selecciona una fecha.", "error");
      return;
    }
    if (!horaCita) {
      showNotification("Por favor, selecciona una hora.", "error");
      return;
    }
    if (!nombreCita) {
      showNotification(
        "Por favor, ingresa el nombre o la razón de la cita.",
        "error"
      );
      return;
    }

    try {
      // Verificar si hay un usuario autenticado
      if (!userId) {
        showNotification("No hay usuario autenticado", "error");
        return;
      }

      if (editingId) {
        // Actualizar cita existente
        const { error } = await supabase
          .from("events")
          .update({
            Name: nombreCita,
            Date: fechaCita,
            Time: horaCita,
            petname: petName // Añadir el nombre de la mascota seleccionada
          })
          .eq("id", editingId);

        if (error) throw error;

        showNotification(
          `Cita actualizada para "${nombreCita}" el ${fechaCita} a las ${horaCita}.`,
          "success"
        );
        setEditingId(null);
      } else {
        // Insertar nueva cita
        const { error } = await supabase.from("events").insert([
          {
            user_id: userId, // ID numérico del usuario
            Name: nombreCita,
            Date: fechaCita,
            Time: horaCita,
            petname: petName // Añadir el nombre de la mascota seleccionada
          },
        ]);

        if (error) throw error;

        showNotification(
          `Cita agendada para "${nombreCita}" el ${fechaCita} a las ${horaCita}.`,
          "success"
        );
      }

      // Recargar las citas
      if (userId) {
        setShowSkeleton(true);
        fetchEvents(userId);
      }

      // Limpiar los campos después de agregar la cita
      setFechaCita("");
      setHoraCita("");
      setNombreCita("");
      setPetName(""); // Limpiar el campo de mascota seleccionada
    } catch (error: any) {
      console.error("Error al guardar la cita:", error);
      showNotification(
        `Error: ${error.message || "No se pudo guardar la cita."}`,
        "error"
      );
    }
  };

  // Función para borrar una cita
  const handleBorrarCita = async (id: number): Promise<void> => {
    try {
      if (!userId) {
        showNotification("No hay usuario autenticado", "error");
        return;
      }

      const { error } = await supabase.from("events").delete().eq("id", id);

      if (error) throw error;

      // Actualizar la lista de citas
      setShowSkeleton(true);
      fetchEvents(userId);

      showNotification("Cita eliminada correctamente.", "success");
    } catch (error: any) {
      console.error("Error al eliminar la cita:", error);
      showNotification(
        `Error: ${error.message || "No se pudo eliminar la cita."}`,
        "error"
      );
    }
  };

  // Función para editar una cita
  const handleEditarCita = (cita: {
    id: number;
    Name: string;
    Date: string;
    Time: string;
    petname?: string;
  }) => {
    setEditingId(cita.id);
    setNombreCita(cita.Name);
    setFechaCita(cita.Date);
    setHoraCita(cita.Time);
    setPetName(cita.petname || ""); // Establecer el nombre de la mascota si existe
  };

  // Renderizar el skeleton loader para las citas
  const renderSkeletonLoader = () => {
    return (
      <div className="tracking-skeleton">
        {/* Skeleton del formulario */}
        <div className="form-container skeleton-form">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-input"></div>
          <div className="skeleton skeleton-input"></div>
          <div className="skeleton skeleton-input"></div>
          <div className="skeleton skeleton-input"></div> {/* Añadir un skeleton para el selector de mascotas */}
          <div className="skeleton skeleton-button"></div>
        </div>

        {/* Skeleton de la lista de citas */}
        <div className="citasAgendadas skeleton-list">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton-cita">
            <div className="skeleton-header">
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div> {/* Añadir un skeleton para el nombre de la mascota */}
            </div>
            <div className="skeleton-actions">
              <div className="skeleton skeleton-button-small"></div>
              <div className="skeleton skeleton-button-small"></div>
            </div>
          </div>
          <div className="skeleton-cita">
            <div className="skeleton-header">
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div> {/* Añadir un skeleton para el nombre de la mascota */}
            </div>
            <div className="skeleton-actions">
              <div className="skeleton skeleton-button-small"></div>
              <div className="skeleton skeleton-button-small"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar las citas en la interfaz
  const renderCitas = () => {
    // Si está cargando, no mostramos nada aquí ya que el skeleton loader
    // se muestra en el contenedor principal
    if (isLoading) {
      return null;
    }

    if (citas.length === 0) {
      return (
        <div className="empty-state">
          <p>No tienes citas agendadas.</p>
          <p className="empty-state-subtitle">
            Agenda tu primera cita usando el formulario de arriba.
          </p>
        </div>
      );
    }

    return (
      <div className="lista-citas">
        {citas.map((cita) => (
          <div key={cita.id} className="cita-item">
            <div className="cita-info">
              <h3>{cita.Name}</h3>
              <p>
                <span className="icon">📅</span>
                {new Date(cita.Date).toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p>
                <span className="icon">⏰</span>
                {cita.Time}
              </p>
              {cita.petname && (
                <p>
                  <span className="icon">🐾</span>
                  Mascota: {cita.petname}
                </p>
              )}
            </div>
            <div className="cita-actions">
              <button
                onClick={() => handleEditarCita(cita)}
                className="btn-editar"
                aria-label="Editar cita"
              >
                Editar
              </button>
              <button
                onClick={() => handleBorrarCita(cita.id)}
                className="btn-borrar"
                aria-label="Borrar cita"
              >
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container-actividades">
      <h2 className="h2-tracking">Agendar Cita</h2>

      {notification && (
        <div className="notification-container">
          <div className={`notification-item ${notification.type}`}>
            <div className="notification-content">
              <span className="notification-text">{notification.message}</span>
            </div>
            <button
              className="notification-close"
              onClick={() => setNotification(null)}
            >
              ×
            </button>
            <div className="notification-progress-bar"></div>
          </div>
        </div>
      )}

      {showSkeleton ? (
        renderSkeletonLoader()
      ) : (
        <>
          <div className="form-container">
            <h3 className="h3-tracking">
              {editingId ? "Editar Cita" : "Nueva Cita"}
            </h3>
            <div className="form-group">
              <label htmlFor="nombreCita">Nombre/Razón de la cita:</label>
              <input
                type="text"
                id="nombreCita"
                value={nombreCita}
                onChange={(e) => setNombreCita(e.target.value)}
                placeholder="Ej: Consulta veterinaria"
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="fechaCita">Fecha:</label>
              <input
                type="date"
                id="fechaCita"
                value={fechaCita}
                onChange={(e) => setFechaCita(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="horaCita">Hora:</label>
              <input
                type="time"
                id="horaCita"
                value={horaCita}
                onChange={(e) => setHoraCita(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="petName">Mascota:</label>
              <select
                id="petName"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                className="pet-select"
              >
                <option value="">Selecciona una mascota</option>
                {userPets.map((pet) => (
                  <option key={pet.id} value={pet.pet_name}>
                    {pet.pet_name} ({pet.pet_type})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button onClick={handleAgendarCita} className="boton">
                {editingId ? "Actualizar Cita" : "Agendar Cita"}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setNombreCita("");
                    setFechaCita("");
                    setHoraCita("");
                    setPetName("");
                  }}
                  className="btn-cancelar"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <div className="citasAgendadas">
            <h3 className="h3-tracking">Mis Citas Agendadas</h3>
            {renderCitas()}
          </div>
        </>
      )}
    </div>
  );
};

export default Actividades;
