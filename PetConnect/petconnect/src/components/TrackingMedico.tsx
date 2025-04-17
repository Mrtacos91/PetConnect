import { useState, ChangeEvent, useEffect } from "react";
import supabase from "../supabase"; // Asegúrate que esta ruta sea correcta
import "../styles/TrackingMedico.css";
import "../styles/style.css";

interface MedicalRecord {
  id: number;
  date: string;
  type: string;
  description: string;
  veterinarian: string;
  user_id?: string;
}

const TrackingMedico = () => {
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

  const [newRecord, setNewRecord] = useState({
    date: "",
    type: "",
    description: "",
    veterinarian: "",
  });

  const [editingRecord, setEditingRecord] = useState<null | number>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Cargar registros desde Supabase
  const fetchMedicalRecords = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("medical_records")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;

      setMedicalRecords(data || []);
    } catch (error) {
      console.error("Error al cargar registros médicos:", error);
      showNotification("Error al cargar los registros médicos", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewRecord((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Añadir nuevo registro a Supabase
  const addRecord = async () => {
    if (!newRecord.date || !newRecord.type || !newRecord.description) {
      showNotification(
        "Por favor, completa todos los campos obligatorios",
        "error"
      );
      return;
    }

    try {
      const { data, error } = await supabase
        .from("medical_records")
        .insert([{
          date: newRecord.date,
          type: newRecord.type,
          description: newRecord.description,
          veterinarian: newRecord.veterinarian || null // Maneja campo opcional
        }])
        .select();

      if (error) {
        console.error("Detalles del error Supabase:", error);
        throw error;
      }

      if (data && data[0]) {
        setMedicalRecords([data[0], ...medicalRecords]);
        resetForm();
        showNotification("Registro médico añadido con éxito", "success");
      }
    } catch (error) {
      console.error("Error completo al añadir:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      showNotification(`Error al añadir registro: ${errorMessage}`, "error");
    }
  };
  // Editar registro en Supabase
  const saveEdit = async () => {
    if (!editingRecord) return;

    try {
      const { data, error } = await supabase
        .from("medical_records")
        .update({ ...newRecord })
        .eq("id", editingRecord)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setMedicalRecords(
          medicalRecords.map((record) =>
            record.id === editingRecord ? data[0] : record
          )
        );
        resetForm();
        showNotification("Registro médico editado con éxito", "success");
      }
    } catch (error) {
      console.error("Error al editar registro médico:", error);
      showNotification("Error al editar el registro médico", "error");
    }
  };

  // Eliminar registro de Supabase
  const deleteRecord = async (id: number) => {
    const confirmDelete = window.confirm(
      "¿Seguro que quieres eliminar este registro?"
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("medical_records")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMedicalRecords(medicalRecords.filter((record) => record.id !== id));
      showNotification("Registro médico eliminado con éxito", "success");
    } catch (error) {
      console.error("Error al eliminar registro médico:", error);
      showNotification("Error al eliminar el registro médico", "error");
    }
  };

  const editRecord = (id: number) => {
    const recordToEdit = medicalRecords.find((record) => record.id === id);
    if (recordToEdit) {
      setNewRecord(recordToEdit);
      setEditingRecord(id);
    }
  };

  const cancelEdit = () => {
    resetForm();
  };

  const resetForm = () => {
    setNewRecord({ date: "", type: "", description: "", veterinarian: "" });
    setEditingRecord(null);
  };

  const renderSkeletonLoader = () => {
    return (
      <div className="skeleton-container">
        {[...Array(4)].map((_, index) => (
          <div key={`skeleton-${index}`} className="skeleton-record">
            <div className="skeleton-header">
              <div className="skeleton-title skeleton"></div>
              <div className="skeleton-text skeleton"></div>
              <div className="skeleton-text skeleton"></div>
              <div className="skeleton-text-sm skeleton"></div>
            </div>
            <div className="skeleton-buttons">
              <div className="skeleton-button-small skeleton"></div>
              <div className="skeleton-button-small skeleton"></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="tracking-container">
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

      <h2 className="h2-tracking">Seguimiento Médico</h2>

      {isLoading ? (
        <div className="loading-container">{renderSkeletonLoader()}</div>
      ) : (
        <>
          <div className="add-record1">
            <h3 className="h3-tracking">
              {editingRecord ? "Editar Registro" : "Agregar Nuevo Registro"}
            </h3>
            <div className="form-group">
              <label htmlFor="date">Fecha:</label>
              <input
                type="date"
                id="date"
                name="date"
                value={newRecord.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Tipo:</label>
              <select
                id="type"
                name="type"
                value={newRecord.type}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecciona el tipo</option>
                <option value="vacuna">Vacuna</option>
                <option value="medicamento">Medicamento</option>
                <option value="consulta">Consulta Veterinaria</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Descripción:</label>
              <input
                type="text"
                id="description"
                name="description"
                value={newRecord.description}
                onChange={handleInputChange}
                placeholder="Ej: Vacuna antirrábica"
                autoComplete="off"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="veterinarian">Veterinario:</label>
              <input
                type="text"
                id="veterinarian"
                name="veterinarian"
                value={newRecord.veterinarian}
                onChange={handleInputChange}
                placeholder="Ej: Dr. García"
                autoComplete="off"
              />
            </div>

            <div className="form-actions">
              {editingRecord ? (
                <>
                  <button onClick={saveEdit} className="save-button">
                    Guardar Cambios
                  </button>
                  <button onClick={cancelEdit} className="cancel-button">
                    Cancelar
                  </button>
                </>
              ) : (
                <button onClick={addRecord} className="add-button">
                  Agregar Registro
                </button>
              )}
            </div>
          </div>

          <div className="records-list1">
            <h3>Registros Médicos</h3>
            {medicalRecords.length > 0 ? (
              <ul>
                {medicalRecords.map((record) => (
                  <li key={record.id}>
                    <div className="record-info">
                      <h4>{record.type}</h4>
                      <p>
                        <strong>Fecha:</strong> {record.date}
                      </p>
                      <p>
                        <span className="icon">💉</span>
                        <strong>Tipo:</strong> {record.type}
                      </p>
                      <p>
                        <span className="icon">📝</span>
                        <strong>Descripción:</strong> {record.description}
                      </p>
                      {record.veterinarian && (
                        <p>
                          <span className="icon">👨‍⚕️</span>
                          <strong>Veterinario:</strong> {record.veterinarian}
                        </p>
                      )}
                    </div>
                    <div className="record-actions">
                      <button
                        onClick={() => editRecord(record.id)}
                        className="btn-editar"
                        aria-label="Editar registro"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteRecord(record.id)}
                        className="btn-borrar"
                        aria-label="Eliminar registro"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay registros médicos disponibles.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TrackingMedico;