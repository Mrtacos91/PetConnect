import { useState, ChangeEvent } from "react";

const TrackingMedico = () => {
  const [medicalRecords, setMedicalRecords] = useState<
    {
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

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewRecord({
      ...newRecord,
      [name]: value,
    });
  };

  const addRecord = () => {
    if (newRecord.date && newRecord.type && newRecord.description) {
      setMedicalRecords([...medicalRecords, newRecord]);
      setNewRecord({
        date: "",
        type: "",
        description: "",
        veterinarian: "",
      });
    } else {
      alert("Por favor, completa todos los campos obligatorios.");
    }
  };

  return (
    <div className="tracking-medico1">
      <h2 className="h2-tracking">Seguimiento Médico</h2>
      <div className="add-record1">
        <h3 className="h3-tracking">Agregar Nuevo Registro</h3>
        <input
          type="date"
          name="date1"
          value={newRecord.date}
          onChange={handleInputChange}
          placeholder="Fecha"
        />
        <select
          name="type1"
          value={newRecord.type}
          onChange={handleInputChange}
        >
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
          name="veterinarian1"
          value={newRecord.veterinarian}
          onChange={handleInputChange}
          placeholder="Veterinario"
        />
        <button onClick={addRecord}>Agregar Registro</button>
      </div>
      <div className="records-list1">
        <h3>Registros Médicos</h3>
        {medicalRecords.length > 0 ? (
          <ul>
            {medicalRecords.map((record, index) => (
              <li key={index}>
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
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay registros médicos disponibles.</p>
        )}
      </div>
    </div>
  );
};

export default TrackingMedico;
