import React, { useState } from 'react';
import '../styles/Carnet.css';

interface VaccinationRecord {
  id: number;
  date: string;
  vaccine: string;
  deworming: string;
  status: 'Completado' | 'Pendiente';
}

const Carnet: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [records, setRecords] = useState<VaccinationRecord[]>([
    {
      id: 1,
      date: '2025-03-11',
      vaccine: 'Rabia',
      deworming: 'Desparasitante A',
      status: 'Completado'
    }
  ]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleChange = (id: number, field: keyof VaccinationRecord, value: string) => {
    setRecords(records.map(record => {
      if (record.id === id) {
        return {
          ...record,
          [field]: field === 'status' ? (value as 'Completado' | 'Pendiente') : value
        };
      }
      return record;
    }));
  };

  const addNewRecord = () => {
    const newRecord: VaccinationRecord = {
      id: records.length + 1,
      date: new Date().toISOString().split('T')[0],
      vaccine: '',
      deworming: '',
      status: 'Pendiente'
    };
    setRecords([...records, newRecord]);
  };

  return (
    <div className="carnet-container">
      <h2 className="carnet-title">Carnet de Vacunación</h2>
      <div>
        {!isEditing ? (
          <button className="edit-button" onClick={handleEdit}>
            Editar
          </button>
        ) : (
          <>
            <button className="save-button" onClick={handleSave}>
              Guardar
            </button>
            <button className="edit-button" onClick={addNewRecord}>
              Agregar Registro
            </button>
          </>
        )}
      </div>
      <table className="carnet-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Vacuna</th>
            <th>Desparasitación</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>
                {isEditing ? (
                  <input
                    type="date"
                    className="input-field"
                    value={record.date}
                    onChange={(e) => handleChange(record.id, 'date', e.target.value)}
                  />
                ) : (
                  record.date
                )}
              </td>
              <td>
                {isEditing ? (
                  <input
                    type="text"
                    className="input-field"
                    value={record.vaccine}
                    onChange={(e) => handleChange(record.id, 'vaccine', e.target.value)}
                  />
                ) : (
                  record.vaccine
                )}
              </td>
              <td>
                {isEditing ? (
                  <input
                    type="text"
                    className="input-field"
                    value={record.deworming}
                    onChange={(e) => handleChange(record.id, 'deworming', e.target.value)}
                  />
                ) : (
                  record.deworming
                )}
              </td>
              <td>
                {isEditing ? (
                  <select
                    className="input-field"
                    value={record.status}
                    onChange={(e) => handleChange(record.id, 'status', e.target.value)}
                  >
                    <option value="Completado">Completado</option>
                    <option value="Pendiente">Pendiente</option>
                  </select>
                ) : (
                  <span className={`status-${record.status.toLowerCase()}`}>
                    {record.status}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Carnet;