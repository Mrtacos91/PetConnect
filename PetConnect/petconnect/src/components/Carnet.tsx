import React, { useState, useEffect, useRef } from "react";
import "../styles/Carnet.css";
import { FaTrashAlt, FaEye, FaDownload, FaTimes } from "react-icons/fa";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import BackButton from "./BackButton";

interface VaccinationRecord {
  id: number;
  date: string;
  vaccine: string;
  deworming: string;
  status: "Completado" | "Pendiente";
}

interface CarnetProps {
  loading?: boolean;
  petName?: string;
  petSpecies?: string;
}

const Carnet: React.FC<CarnetProps> = ({
  loading = false,
  petName = "Firulais",
  petSpecies = "Canino",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(loading);
  const [showPreview, setShowPreview] = useState(false);
  const [records, setRecords] = useState<VaccinationRecord[]>([
    {
      id: 1,
      date: "2025-03-11",
      vaccine: "Rabia",
      deworming: "Desparasitante A",
      status: "Completado",
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
      vaccine: "",
      deworming: "",
      status: "Pendiente",
    };
    setRecords([...records, newRecord]);
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
          `carnet_vacunacion_${petName.toLowerCase().replace(/\s+/g, "_")}.pdf`
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
      <div className="carnet-backbt">
        <BackButton />
      </div>
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
        <p>
          <strong>Mascota:</strong> {petName}
        </p>
        <p>
          <strong>Especie:</strong> {petSpecies}
        </p>
      </div>

      <div className="carnet-table-container">
        <table className="carnet-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Vacuna</th>
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
                  <td data-label="Vacuna">
                    {isEditing ? (
                      <input
                        type="text"
                        className="input-field"
                        value={record.vaccine}
                        onChange={(e) =>
                          handleChange(record.id, "vaccine", e.target.value)
                        }
                      />
                    ) : (
                      record.vaccine
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
                      record.deworming
                    )}
                  </td>
                  <td data-label="Estado">
                    {isEditing ? (
                      <select
                        className="input-field"
                        value={record.status}
                        onChange={(e) =>
                          handleChange(record.id, "status", e.target.value)
                        }
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
                  {isEditing && (
                    <td className="action-cell">
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
                <td colSpan={isEditing ? 5 : 4} className="no-records">
                  No hay registros. Haz clic en "Agregar Registro" para
                  comenzar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de vista previa del PDF */}
      {showPreview && (
        <div className="pdf-preview-overlay">
          <div className="pdf-preview-container">
            <div className="pdf-preview-header">
              <h3>Vista Previa del Carnet</h3>
              <button className="close-preview-button" onClick={togglePreview}>
                <FaTimes />
              </button>
            </div>
            <div className="pdf-preview-content" ref={pdfPreviewRef}>
              <div className="pdf-header">
                <h2>Carnet de Vacunación</h2>
                <div className="pdf-pet-info">
                  <p>
                    <strong>Mascota:</strong> {petName}
                  </p>
                  <p>
                    <strong>Especie:</strong> {petSpecies}
                  </p>
                  <p>
                    <strong>Fecha de emisión:</strong>{" "}
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <table className="pdf-table">
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
                      <td>{record.date}</td>
                      <td>{record.vaccine}</td>
                      <td>{record.deworming}</td>
                      <td className={`status-${record.status.toLowerCase()}`}>
                        {record.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pdf-footer">
                <p>PetConnect - Cuidando de tus mascotas</p>
              </div>
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

// Componente Skeleton para Carnet
export const CarnetSkeleton: React.FC = () => {
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
        </div>
        <div className="carnet-table-row-skeleton">
          <div className="skeleton-carnet"></div>
          <div className="skeleton-carnet"></div>
          <div className="skeleton-carnet"></div>
          <div className="skeleton-carnet"></div>
        </div>
        <div className="carnet-table-row-skeleton">
          <div className="skeleton-carnet"></div>
          <div className="skeleton-carnet"></div>
          <div className="skeleton-carnet"></div>
          <div className="skeleton-carnet"></div>
        </div>
      </div>
    </div>
  );
};

export default Carnet;
