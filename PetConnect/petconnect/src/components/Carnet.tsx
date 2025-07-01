import React, { useState, useEffect, useRef } from "react";
import "../styles/Carnet.css";
import { FaTrashAlt, FaEye, FaDownload, FaTimes, FaPlus } from "react-icons/fa";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface VaccinationRecord {
  id: number;
  date: string;
  vaccineType: string;
  vaccineName: string;
  deworming: string;
  status: "Completado" | "Pendiente";
}

const VACCINE_TYPES = [
  "Rabia",
  "Moquillo",
  "Parvovirus",
  "Leptospirosis",
  "Bordetella",
  "Otra",
];

interface CarnetProps {
  loading?: boolean;
  petName?: string;
  petSpecies?: string;
  onCreateNewCarnet?: () => void;
  carnetId?: number;
  onUpdateCarnet?: (id: number, petName: string, petSpecies: string) => void;
  onDeleteCarnet?: (id: number) => void;
}

const Carnet: React.FC<CarnetProps> = ({
  loading = false,
  petName = "Firulais",
  petSpecies = "Canino",
  onCreateNewCarnet,
  carnetId,
  onUpdateCarnet,
  onDeleteCarnet,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(loading);
  const [showPreview, setShowPreview] = useState(false);
  const [petNameValue, setPetNameValue] = useState(petName);
  const [petSpeciesValue, setPetSpeciesValue] = useState(petSpecies);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [carnetToDelete, setCarnetToDelete] = useState<number | null>(null);

  // Actualizar los estados cuando cambien las props
  useEffect(() => {
    setPetNameValue(petName);
    setPetSpeciesValue(petSpecies);
  }, [petName, petSpecies]);
  const [records, setRecords] = useState<VaccinationRecord[]>([
    {
      id: 1,
      date: new Date().toISOString().split("T")[0],
      vaccineType: "Rabia",
      vaccineName: "Rabia Inactivada",
      deworming: "Desparasitante A",
      status: "Pendiente",
    },
  ]);

  const carnetRef = useRef<HTMLDivElement>(null);
  const pdfPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    // Guardar cambios y notificar al componente padre si existe la función onUpdateCarnet
    if (onUpdateCarnet && carnetId) {
      onUpdateCarnet(carnetId, petNameValue, petSpeciesValue);
    }
    // Aquí también se podrían guardar los cambios en una base de datos o enviar a un API
  };

  const handleCreateNewCarnet = () => {
    if (onCreateNewCarnet) {
      onCreateNewCarnet();
    }
  };

  const handleChange = (
    id: number,
    field: keyof VaccinationRecord,
    value: string
  ) => {
    setRecords(
      records.map((record) => {
        if (record.id === id) {
          return {
            ...record,
            [field]:
              field === "status"
                ? (value as "Completado" | "Pendiente")
                : value,
          };
        }
        return record;
      })
    );
  };

  const addNewRecord = () => {
    const newRecord: VaccinationRecord = {
      id: records.length > 0 ? Math.max(...records.map((r) => r.id)) + 1 : 1,
      date: new Date().toISOString().split("T")[0],
      vaccineType: "",
      vaccineName: "",
      deworming: "",
      status: "Pendiente",
    };
    setRecords([...records, newRecord]);
    // Desplazar al final del formulario
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  const deleteRecord = (id: number) => {
    setRecords(records.filter((record) => record.id !== id));
  };

  const generatePDF = () => {
    if (pdfPreviewRef.current) {
      html2canvas(pdfPreviewRef.current).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
        pdf.save(
          `carnet_vacunacion_${petNameValue
            .toLowerCase()
            .replace(/\s+/g, "_")}.pdf`
        );
      });
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  if (isLoading) {
    return <CarnetSkeleton />;
  }

  return (
    <div className="carnet-container" ref={carnetRef}>
      <div className="carnet-header">
        <h2 className="carnet-title">Carnet de Vacunación</h2>
        <div className="carnet-actions">
          {!isEditing ? (
            <>
              <button
                className="carnet-action-button preview-button"
                onClick={togglePreview}
              >
                <FaEye /> <span className="button-text">Vista Previa</span>
              </button>
              <button className="edit-button" onClick={handleEdit}>
                Editar
              </button>
              <button
                className="carnet-action-button add-button"
                onClick={handleCreateNewCarnet}
              >
                <FaPlus /> <span className="button-text">Nuevo Carnet</span>
              </button>
              {onDeleteCarnet && carnetId && (
                <>
                  <button
                    className="carnet-action-button delete-button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCarnetToDelete(carnetId);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <FaTrashAlt /> <span className="button-text">Eliminar</span>
                  </button>
                  {showDeleteConfirm && (
                    <div className="delete-confirm-overlay">
                      <div className="delete-confirm-dialog">
                        <h3>¿Estás seguro?</h3>
                        <p>¿Deseas eliminar este carnet de forma permanente?</p>
                        <div className="delete-confirm-buttons">
                          <button
                            className="cancel-button-carnet"
                            onClick={() => setShowDeleteConfirm(false)}
                          >
                            Cancelar
                          </button>
                          <button
                            className="confirm-delete-button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (carnetToDelete) {
                                onDeleteCarnet(carnetToDelete);
                                setShowDeleteConfirm(false);
                                setCarnetToDelete(null);
                              }
                            }}
                          >
                            Sí, eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <button className="save-button" onClick={handleSave}>
                Guardar
              </button>
              <button className="edit-button add-button" onClick={addNewRecord}>
                Agregar Registro
              </button>
            </>
          )}
        </div>
      </div>

      <div className="carnet-pet-info">
        {isEditing ? (
          <>
            <div className="form-field">
              <label>
                <strong>Mascota:</strong>
              </label>
              <input
                type="text"
                className="input-field"
                value={petNameValue}
                onChange={(e) => setPetNameValue(e.target.value)}
                placeholder="Nombre de la mascota"
              />
            </div>
            <div className="form-field">
              <label>
                <strong>Especie:</strong>
              </label>
              <input
                type="text"
                className="input-field"
                value={petSpeciesValue}
                onChange={(e) => setPetSpeciesValue(e.target.value)}
                placeholder="Especie de la mascota"
              />
            </div>
          </>
        ) : (
          <>
            <p>
              <strong>Mascota:</strong> {petNameValue}
            </p>
            <p>
              <strong>Especie:</strong> {petSpeciesValue}
            </p>
          </>
        )}
      </div>

      <div className="carnet-table-container">
        {/* Tabla para pantallas grandes */}
        <table className="carnet-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo de Vacuna</th>
              <th>Nombre de Vacuna</th>
              <th>Desparasitación</th>
              <th>Estado</th>
              {isEditing && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? (
              records.map((record) => (
                <tr key={record.id}>
                  <td data-label="Fecha">
                    {isEditing ? (
                      <input
                        type="date"
                        className="input-field"
                        value={record.date}
                        onChange={(e) =>
                          handleChange(record.id, "date", e.target.value)
                        }
                      />
                    ) : (
                      record.date
                    )}
                  </td>
                  <td data-label="Tipo de Vacuna">
                    {isEditing ? (
                      <select
                        className="input-field"
                        value={record.vaccineType}
                        onChange={(e) =>
                          handleChange(record.id, "vaccineType", e.target.value)
                        }
                        required
                      >
                        <option value="">Seleccione...</option>
                        {VACCINE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    ) : (
                      record.vaccineType || "-"
                    )}
                  </td>
                  <td data-label="Nombre de Vacuna">
                    {isEditing ? (
                      <input
                        type="text"
                        className="input-field"
                        value={record.vaccineName}
                        onChange={(e) =>
                          handleChange(record.id, "vaccineName", e.target.value)
                        }
                        placeholder="Ej: Rabia Inactivada"
                        required
                      />
                    ) : (
                      record.vaccineName || "-"
                    )}
                  </td>
                  <td data-label="Desparasitación">
                    {isEditing ? (
                      <input
                        type="text"
                        className="input-field"
                        value={record.deworming}
                        onChange={(e) =>
                          handleChange(record.id, "deworming", e.target.value)
                        }
                      />
                    ) : (
                      record.deworming || "-"
                    )}
                  </td>
                  <td data-label="Estado">
                    {isEditing ? (
                      <select
                        className="input-field"
                        value={record.status}
                        onChange={(e) =>
                          handleChange(
                            record.id,
                            "status",
                            e.target.value as "Completado" | "Pendiente"
                          )
                        }
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Completado">Completado</option>
                      </select>
                    ) : (
                      <span
                        className={`status-badge ${
                          record.status === "Completado"
                            ? "completed"
                            : "pending"
                        }`}
                      >
                        {record.status}
                      </span>
                    )}
                  </td>
                  {isEditing && (
                    <td className="actions-cell">
                      <button
                        className="delete-button"
                        onClick={() => deleteRecord(record.id)}
                        aria-label="Eliminar registro"
                      >
                        <FaTrashAlt />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isEditing ? 6 : 5} className="no-records">
                  No hay registros de vacunación
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Mensaje de "No hay registros" para móviles */}
        {records.length === 0 && (
          <div className="no-records-mobile">
            No hay registros de vacunación
          </div>
        )}

        {/* Vista de tarjetas para móviles */}
        <div className="mobile-cards-container">
          {records.length > 0 ? (
            records.map((record) => (
              <div key={record.id} className="record-card">
                <div className="record-card-content">
                  <div className="form-field">
                    <label>Fecha</label>
                    {isEditing ? (
                      <input
                        type="date"
                        className="input-field"
                        value={record.date}
                        onChange={(e) =>
                          handleChange(record.id, "date", e.target.value)
                        }
                      />
                    ) : (
                      <div className="field-value">{record.date}</div>
                    )}
                  </div>

                  <div className="form-field">
                    <label>Tipo de Vacuna</label>
                    {isEditing ? (
                      <select
                        className="input-field"
                        value={record.vaccineType}
                        onChange={(e) =>
                          handleChange(record.id, "vaccineType", e.target.value)
                        }
                        required
                      >
                        <option value="">Seleccione...</option>
                        {VACCINE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="field-value">
                        {record.vaccineType || "-"}
                      </div>
                    )}
                  </div>

                  <div className="form-field">
                    <label>Nombre de Vacuna</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input-field"
                        value={record.vaccineName}
                        onChange={(e) =>
                          handleChange(record.id, "vaccineName", e.target.value)
                        }
                        placeholder="Ej: Rabia Inactivada"
                        required
                      />
                    ) : (
                      <div className="field-value">
                        {record.vaccineName || "-"}
                      </div>
                    )}
                  </div>

                  <div className="form-field">
                    <label>Desparasitación</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input-field"
                        value={record.deworming}
                        onChange={(e) =>
                          handleChange(record.id, "deworming", e.target.value)
                        }
                      />
                    ) : (
                      <div className="field-value">
                        {record.deworming || "-"}
                      </div>
                    )}
                  </div>

                  <div className="form-field">
                    <label>Estado</label>
                    {isEditing ? (
                      <select
                        className="input-field"
                        value={record.status}
                        onChange={(e) =>
                          handleChange(
                            record.id,
                            "status",
                            e.target.value as "Completado" | "Pendiente"
                          )
                        }
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Completado">Completado</option>
                      </select>
                    ) : (
                      <span
                        className={`status-badge ${
                          record.status === "Completado"
                            ? "completed"
                            : "pending"
                        }`}
                      >
                        {record.status}
                      </span>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="card-actions">
                    <button
                      className="delete-button"
                      onClick={() => deleteRecord(record.id)}
                      aria-label="Eliminar registro"
                    >
                      <FaTrashAlt /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-records">No hay registros de vacunación</div>
          )}
        </div>
      </div>

      {/* Vista previa del PDF */}
      {showPreview && (
        <div className="pdf-preview-overlay">
          <div className="pdf-preview-container">
            <div className="pdf-preview-header">
              <h3>Vista Previa del Carnet</h3>
              <button
                className="close-preview"
                onClick={togglePreview}
                aria-label="Cerrar vista previa"
              >
                <FaTimes />
              </button>
            </div>
            <div className="pdf-content" ref={pdfPreviewRef}>
              <h2>Carnet de Vacunación</h2>
              <div className="pdf-pet-info">
                <p>
                  <strong>Mascota:</strong> {petNameValue}
                </p>
                <p>
                  <strong>Especie:</strong> {petSpeciesValue}
                </p>
              </div>
              <table className="pdf-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo de Vacuna</th>
                    <th>Nombre de Vacuna</th>
                    <th>Desparasitación</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>{record.date}</td>
                      <td>{record.vaccineType || "-"}</td>
                      <td>{record.vaccineName || "-"}</td>
                      <td>{record.deworming || "-"}</td>
                      <td>{record.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pdf-preview-actions">
              <button className="download-pdf-button" onClick={generatePDF}>
                <FaDownload /> Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CarnetSkeleton = () => {
  return (
    <div className="carnet-container skeleton-container">
      <div className="carnet-header">
        <div className="carnet-title-skeleton skeleton-carnet"></div>
        <div className="carnet-actions-skeleton">
          <div className="carnet-button-skeleton skeleton-carnet"></div>
          <div className="carnet-button-skeleton skeleton-carnet"></div>
        </div>
      </div>
      <div className="carnet-pet-info-skeleton">
        <div className="skeleton-carnet"></div>
        <div className="skeleton-carnet"></div>
      </div>
      <div className="carnet-table-skeleton">
        <div className="carnet-table-header-skeleton">
          <div className="skeleton-carnet"></div>
          <div className="skeleton-carnet"></div>
          <div className="skeleton-carnet"></div>
          <div className="skeleton-carnet"></div>
          <div className="skeleton-carnet"></div>
        </div>
        {[1, 2, 3].map((row) => (
          <div key={row} className="carnet-table-row-skeleton">
            <div className="skeleton-carnet"></div>
            <div className="skeleton-carnet"></div>
            <div className="skeleton-carnet"></div>
            <div className="skeleton-carnet"></div>
            <div className="skeleton-carnet"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Carnet;
