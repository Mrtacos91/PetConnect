import { useState } from 'react';

const Actividades = () => {
    const [fechaCita, setFechaCita] = useState('');
    const [horaCita, setHoraCita] = useState('');
    const [nombreCita, setNombreCita] = useState(''); // Campo para nombre o razón de la cita
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [citas, setCitas] = useState<{ nombre: string; fecha: string; hora: string }[]>([]);

    // Función para agendar la cita
    const handleAgendarCita = () => {
        // Validar si se seleccionó fecha, hora y nombre de la cita
        if (!fechaCita) {
            setError('Por favor, selecciona una fecha.');
            return;
        }
        if (!horaCita) {
            setError('Por favor, selecciona una hora.');
            return;
        }
        if (!nombreCita) {
            setError('Por favor, ingresa el nombre o la razón de la cita.');
            return;
        }

        // Agregar la cita al array de citas
        const nuevaCita = { nombre: nombreCita, fecha: fechaCita, hora: horaCita };
        setCitas([...citas, nuevaCita]);

        // Limpiar los campos después de agregar la cita
        setFechaCita('');
        setHoraCita('');
        setNombreCita('');
        setError('');
        setMensaje(`✅ Cita agendada para "${nombreCita}" el ${fechaCita} a las ${horaCita}.`);
    };

    // Función para borrar una cita
    function handleBorrarCita(index: number): void {
        const citasActualizadas = citas.filter((_, i) => i !== index);
        setCitas(citasActualizadas);
    }

    // Función para editar una cita
    // Esta parte no está completa en tu código, pero aquí te doy la estructura básica.

    return (
        <div className="container">
            <h2 className="titulo">Agendar Cita</h2>

            {/* Formulario de selección de nombre, fecha y hora */}
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

            {/* Botón para agendar cita */}
            <button
                onClick={handleAgendarCita}
                className="boton"
                disabled={!fechaCita || !horaCita || !nombreCita}
            >
                Agendar Cita
            </button>

            {/* Mensajes de error o confirmación */}
            {error && <p className="mensajeError">{error}</p>}
            {mensaje && <p className="mensajeExito">{mensaje}</p>}

            {/* Sección de citas programadas */}
            <div className="citasAgendadas">
                <h3>Citas Agendadas</h3>
                <ul>
                    {citas.length === 0 ? (
                        <li>No tienes citas agendadas.</li>
                    ) : (
                        citas.map((cita, index) => (
                            <li key={index}>
                                {`Cita: "${cita.nombre}" para el ${cita.fecha} a las ${cita.hora}`}
                                <button
                                    onClick={() => {
                                        // Función para editar cita
                                        const citaAEditar = citas[index];
                                        setFechaCita(citaAEditar.fecha);
                                        setHoraCita(citaAEditar.hora);
                                        setNombreCita(citaAEditar.nombre);

                                        // Eliminar la cita original antes de editarla
                                        const citasActualizadas = citas.filter((_, i) => i !== index);
                                        setCitas(citasActualizadas);
                                    }}
                                >
                                    Editar
                                </button>
                                <button onClick={() => handleBorrarCita(index)}>Borrar</button>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
};

export default Actividades;
