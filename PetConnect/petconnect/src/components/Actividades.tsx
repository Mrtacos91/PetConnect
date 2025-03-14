import { useState, useEffect } from "react";
import "../styles/Actividades.css";

const Actividades = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [fechaCita, setFechaCita] = useState("");
  const [horaCita, setHoraCita] = useState("");
  const [nombreCita, setNombreCita] = useState(""); // Campo para nombre o razón de la cita
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [citas, setCitas] = useState<
    { nombre: string; fecha: string; hora: string }[]
  >([]);

  useEffect(() => {
    // Simular tiempo de carga
    setTimeout(() => setIsLoading(false), 2000);
  }, []);

  // Función para agendar la cita
  const handleAgendarCita = () => {
    // Validar si se seleccionó fecha, hora y nombre de la cita
    if (!fechaCita) {
      setError("Por favor, selecciona una fecha.");
      return;
    }
    if (!horaCita) {
      setError("Por favor, selecciona una hora.");
      return;
    }
    if (!nombreCita) {
      setError("Por favor, ingresa el nombre o la razón de la cita.");
      return;
    }

    // Agregar la cita al array de citas
    const nuevaCita = { nombre: nombreCita, fecha: fechaCita, hora: horaCita };
    setCitas([...citas, nuevaCita]);

    // Limpiar los campos después de agregar la cita
    setFechaCita("");
    setHoraCita("");
    setNombreCita("");
    setError("");
    setMensaje(
      `✅ Cita agendada para "${nombreCita}" el ${fechaCita} a las ${horaCita}.`
    );
  };

  // Función para borrar una cita
  function handleBorrarCita(index: number): void {
    const citasActualizadas = citas.filter((_, i) => i !== index);
    setCitas(citasActualizadas);
  }

  // Función para editar una cita
  // Esta parte no está completa en tu código, pero aquí te doy la estructura básica.

  return (
    <div className="container-actividades">
      <h2 className="titulo">Agendar Cita</h2>

      {isLoading ? (
        // Skeleton loader
        <div className="actividades-skeleton">
          {/* Skeleton del formulario */}
          <div className="seccion skeleton-form">
            <div className="skeleton skeleton-subtitle"></div>
            <div className="skeleton-inputs">
              <div className="skeleton skeleton-input"></div>
              <div className="skeleton skeleton-input"></div>
              <div className="skeleton skeleton-input"></div>
            </div>
            <div className="skeleton skeleton-button"></div>
          </div>

          {/* Skeleton de la lista de citas */}
          <div className="citasAgendadas skeleton-list">
            <div className="skeleton skeleton-subtitle"></div>
            <div className="skeleton-appointments">
              <div className="skeleton-appointment">
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton-buttons">
                  <div className="skeleton skeleton-button-small"></div>
                  <div className="skeleton skeleton-button-small"></div>
                </div>
              </div>
              <div className="skeleton-appointment">
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton-buttons">
                  <div className="skeleton skeleton-button-small"></div>
                  <div className="skeleton skeleton-button-small"></div>
                </div>
              </div>
              <div className="skeleton-appointment">
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton-buttons">
                  <div className="skeleton skeleton-button-small"></div>
                  <div className="skeleton skeleton-button-small"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Contenido real
        <>
          <div className="seccion">
            <h3 className="subtitulo">Detalles de la Cita:</h3>
            <div>
              <input
                type="text"
                value={nombreCita}
                onChange={(e) => setNombreCita(e.target.value)}
                placeholder="Nombre o razón de la cita"
                className="input"
              />
              <input
                type="date"
                value={fechaCita}
                onChange={(e) => setFechaCita(e.target.value)}
                className="input"
              />
              <input
                type="time"
                value={horaCita}
                onChange={(e) => setHoraCita(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <button
            onClick={handleAgendarCita}
            className="boton"
            disabled={!fechaCita || !horaCita || !nombreCita}
          >
            Agendar Cita
          </button>

          {error && <p className="mensajeError">{error}</p>}
          {mensaje && <p className="mensajeExito">{mensaje}</p>}

          <div className="citasAgendadas">
            <h3>Citas Agendadas</h3>
            <ul>
              {citas.length === 0 ? (
                <li>No tienes citas agendadas.</li>
              ) : (
                citas.map((cita, index) => (
                  <li key={index}>
                    {`Cita: "${cita.nombre}" para el ${cita.fecha} a las ${cita.hora}`}
                    <div className="appointment-buttons">
                      <button
                        onClick={() => {
                          const citaAEditar = citas[index];
                          setFechaCita(citaAEditar.fecha);
                          setHoraCita(citaAEditar.hora);
                          setNombreCita(citaAEditar.nombre);
                          const citasActualizadas = citas.filter(
                            (_, i) => i !== index
                          );
                          setCitas(citasActualizadas);
                        }}
                      >
                        Editar
                      </button>
                      <button onClick={() => handleBorrarCita(index)}>
                        Borrar
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default Actividades;
