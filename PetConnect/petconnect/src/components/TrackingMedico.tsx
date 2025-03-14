import { useState, ChangeEvent, useEffect } from "react";
import "../styles/TrackingMedico.css";

const TrackingMedico = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [medicalRecords, setMedicalRecords] = useState<
    {
      id: number;
      date: string;
      type: string;
      description: string;
      veterinarian: string;
    }[]
  >([]);

  const [newRecord, setNewRecord] = useState({
    date: "",
    type: "",
    description: "",
    veterinarian: "",
  });

  const [editingRecord, setEditingRecord] = useState<null | number>(null);

  useEffect(() => {
    // Simular tiempo de carga
    setTimeout(() => setIsLoading(false), 2000);
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

  const addRecord = () => {
    if (newRecord.date && newRecord.type && newRecord.description) {
      const newEntry = { id: Date.now(), ...newRecord };
      setMedicalRecords([...medicalRecords, newEntry]);
      resetForm();
    } else {
      alert("Por favor, completa todos los campos obligatorios.");
    }
  };

  const editRecord = (id: number) => {
    const recordToEdit = medicalRecords.find((record) => record.id === id);
    if (recordToEdit) {
      setNewRecord(recordToEdit);
      setEditingRecord(id);
    }
  };

  const saveEdit = () => {
    setMedicalRecords(
      medicalRecords.map((record) =>
        record.id === editingRecord ? { ...record, ...newRecord } : record
      )
    );
    resetForm();
  };

  const cancelEdit = () => {
    resetForm(); // Restablece el formulario y sale del modo edición
  };

  const deleteRecord = (id: number) => {
    const confirmDelete = window.confirm("¿Seguro que quieres eliminar este registro?");
    if (confirmDelete) {
      setMedicalRecords(medicalRecords.filter((record) => record.id !== id));
    }
  };

  const resetForm = () => {
    setNewRecord({ date: "", type: "", description: "", veterinarian: "" });
    setEditingRecord(null);
  };

  return (
    <div className="tracking-medico1">
      <h2 className="h2-tracking">Seguimiento Médico</h2>
      
      {isLoading ? (
        // Skeleton loader para el formulario y la lista
        <div className="tracking-skeleton">
          {/* Skeleton del formulario */}
          <div className="add-record1 skeleton-form">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-input"></div>
            <div className="skeleton skeleton-input"></div>
            <div className="skeleton skeleton-input"></div>
            <div className="skeleton skeleton-input"></div>
            <div className="skeleton skeleton-button"></div>
          </div>

          {/* Skeleton de la lista de registros */}
          <div className="records-list1 skeleton-list">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton-record">
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton-buttons">
                <div className="skeleton skeleton-button-small"></div>
                <div className="skeleton skeleton-button-small"></div>
              </div>
            </div>
            <div className="skeleton-record">
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton-buttons">
                <div className="skeleton skeleton-button-small"></div>
                <div className="skeleton skeleton-button-small"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Contenido real
        <>
          <div className="add-record1">
            <h3 className="h3-tracking">
              {editingRecord ? "Editar Registro" : "Agregar Nuevo Registro"}
            </h3>
            <input
              type="date"
              name="date"
              value={newRecord.date}
              onChange={handleInputChange}
              placeholder="Fecha"
            />
            <select name="type" value={newRecord.type} onChange={handleInputChange}>
              <option value="">Selecciona el tipo</option>
              <option value="vacuna">Vacuna</option>
              <option value="medicamento">Medicamento</option>
              <option value="consulta">Consulta Veterinaria</option>
              <option value="otro">Otro</option>
            </select>
            <input
              type="text"
              name="description"
              value={newRecord.description}
              onChange={handleInputChange}
              placeholder="Descripción"
            />
            <input
              type="text"
              name="veterinarian"
              value={newRecord.veterinarian}
              onChange={handleInputChange}
              placeholder="Veterinario"
            />
            {editingRecord ? (
              <>
                <button className="button-edit-tm" onClick={saveEdit}>
                  Guardar Cambios
                </button>
                <button className="button-cancel-tm" onClick={cancelEdit}>
                  Cancelar
                </button>
              </>
            ) : (
              <button className="button-add-tm" onClick={addRecord}>
                Agregar Registro
              </button>
            )}
          </div>
          <div className="records-list1">
            <h3>Registros Médicos</h3>
            {medicalRecords.length > 0 ? (
              <ul>
                {medicalRecords.map((record) => (
                  <li key={record.id}>
                    <p>
                      <strong>Fecha:</strong> {record.date}
                    </p>
                    <p>
                      <strong>Tipo:</strong> {record.type}
                    </p>
                    <p>
                      <strong>Descripción:</strong> {record.description}
                    </p>
                    <p>
                      <strong>Veterinario:</strong> {record.veterinarian}
                    </p>
                    <div className="record-buttons">
                      <button onClick={() => editRecord(record.id)}>Editar</button>
                      <button onClick={() => deleteRecord(record.id)}>Eliminar</button>
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
