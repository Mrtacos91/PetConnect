import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Carnet.css";
import { FaTrashAlt, FaEye, FaDownload, FaTimes } from "react-icons/fa";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import BackButton from "./BackButton";
import supabase from "../supabase";

interface VaccinationRecord {
  id?: number;
  date: string;
  vaccine: string;
  deworming: string;
  status: "Completado" | "Pendiente";
  pet_id?: number;
}

interface PetData {
  id?: number;
  name: string;
  species: string;
  weight: string;
  age: string;
  owner_id?: string;
}

interface CarnetProps {
  loading?: boolean;
  petId?: number;
}

const Carnet: React.FC<CarnetProps> = ({ loading = false, petId }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPetInfo, setIsEditingPetInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(loading);
  const [showPreview, setShowPreview] = useState(false);
  const [petData, setPetData] = useState<PetData>({
    name: "",
    species: "",
    weight: "",
    age: ""
  });
  const [records, setRecords] = useState<VaccinationRecord[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const carnetRef = useRef<HTMLDivElement>(null);
  const pdfPreviewRef = useRef<HTMLDivElement>(null);

  // Función para verificar y obtener el usuario autenticado
  const checkUser = async () => {
    // 1️⃣ OBTENER USUARIO DE SUPABASE AUTH
    const { data: sessionData, error: sessionError } = await supabase.auth.getUser();

    if (sessionError || !sessionData?.user) {
      console.error("Error de sesión:", sessionError);
      navigate("/login");
      return null;
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
        return null;
      }

      // Establecer el ID del usuario
      const foundUserId = localUser.id;
      setUserId(foundUserId);
      console.log("ID del usuario local:", foundUserId);
      return foundUserId;
    } catch (e) {
      console.error("Error al identificar el usuario:", e);
      showNotification("Error al identificar el usuario", "error");
      return null;
    }
  };

  // Función para mostrar notificaciones
  const showNotification = (message: string, type: "success" | "error") => {
    // Implementa tu sistema de notificaciones aquí
    if (type === "error") {
      console.error(message);
    } else {
      console.log(message);
    }
    // Ejemplo con toast: toast[type](message);
  };

  useEffect(() => {
    const initializeComponent = async () => {
      const currentUserId = await checkUser();
      if (currentUserId && petId) {
        fetchPetData(currentUserId);
        fetchVaccinationRecords();
      }
    };

    initializeComponent();
  }, [petId]);

  const fetchPetData = async (currentUserId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .eq('owner_id', currentUserId)
        .single();

      if (error) throw error;
      if (data) setPetData(data);
    } catch (error) {
      console.error('Error fetching pet data:', error);
      showNotification("Error al obtener datos de la mascota", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVaccinationRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('vaccination_records')
        .select('*')
        .eq('pet_id', petId)
        .order('date', { ascending: false });

      if (error) throw error;
      if (data) setRecords(data);
    } catch (error) {
      console.error('Error fetching vaccination records:', error);
      showNotification("Error al obtener registros de vacunación", "error");
    }
  };

  const savePetData = async () => {
    if (!userId) {
      showNotification("No se pudo identificar al usuario", "error");
      return;
    }

    setIsLoading(true);
    try {
      if (petId) {
        // Actualizar mascota existente
        const { error } = await supabase
          .from('pets')
          .update({ ...petData, owner_id: userId })
          .eq('id', petId)
          .eq('owner_id', userId);

        if (error) throw error;
        showNotification("Datos de la mascota actualizados correctamente", "success");
      } else {
        // Crear nueva mascota
        const { data, error } = await supabase
          .from('pets')
          .insert([{ ...petData, owner_id: userId }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setPetData(data);
          showNotification("Mascota creada correctamente", "success");
          // Aquí deberías manejar la actualización del petId si es necesario
        }
      }
    } catch (error) {
      console.error('Error saving pet data:', error);
      showNotification("Error al guardar datos de la mascota", "error");
    } finally {
      setIsLoading(false);
      setIsEditingPetInfo(false);
    }
  };

  const saveVaccinationRecords = async () => {
    if (!petId || !userId) {
      showNotification("No se pudo identificar la mascota o el usuario", "error");
      return;
    }

    setIsLoading(true);
    try {
      // Obtener los IDs actuales de los registros
      const currentIds = records.map(r => r.id).filter(Boolean) as number[];

      // Obtener registros existentes en la base de datos
      const { data: existingRecords } = await supabase
        .from('vaccination_records')
        .select('id')
        .eq('pet_id', petId);

      // Identificar registros a eliminar
      const recordsToDelete = existingRecords?.filter(r => !currentIds.includes(r.id));
      if (recordsToDelete?.length) {
        const { error } = await supabase
          .from('vaccination_records')
          .delete()
          .in('id', recordsToDelete.map(r => r.id));

        if (error) throw error;
      }

      // Procesar cada registro
      for (const record of records) {
        const recordData = {
          date: record.date,
          vaccine: record.vaccine,
          deworming: record.deworming,
          status: record.status,
          pet_id: petId
        };

        if (record.id) {
          // Actualizar registro existente
          const { error } = await supabase
            .from('vaccination_records')
            .update(recordData)
            .eq('id', record.id)
            .eq('pet_id', petId);

          if (error) throw error;
        } else {
          // Crear nuevo registro
          const { error } = await supabase
            .from('vaccination_records')
            .insert([recordData]);

          if (error) throw error;
        }
      }

      // Refrescar los datos
      await fetchVaccinationRecords();
      showNotification("Registros de vacunación guardados correctamente", "success");
    } catch (error) {
      console.error('Error saving vaccination records:', error);
      showNotification("Error al guardar registros de vacunación", "error");
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    saveVaccinationRecords();
  };

  const handleEditPetInfo = () => {
    setIsEditingPetInfo(true);
  };

  const handleSavePetInfo = () => {
    savePetData();
  };

  const handlePetDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPetData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChange = (
    id: number | undefined,
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
      id: records.length > 0 ? Math.max(...records.map(r => r.id || 0)) + 1 : 1,
      date: new Date().toISOString().split('T')[0],
      vaccine: "",
      deworming: "",
      status: "Pendiente",
    };
    setRecords([...records, newRecord]);
  };

  const deleteRecord = (id: number | undefined) => {
    if (!id) return;
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
          `carnet_vacunacion_${petData.name.toLowerCase().replace(/\s+/g, "_")}.pdf`
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
                Editar Vacunas
              </button>
              <button className="edit-button" onClick={handleEditPetInfo}>
                Editar Mascota
              </button>
            </>
          ) : (
            <>
              <button className="save-button" onClick={handleSave}>
                Guardar Vacunas
              </button>
              <button className="edit-button add-button" onClick={addNewRecord}>
                Agregar Registro
              </button>
            </>
          )}
        </div>
      </div>

      <div className="carnet-pet-info">
        {isEditingPetInfo ? (
          <div className="pet-info-editor">
            <div className="pet-info-field">
              <label>Nombre:</label>
              <input
                type="text"
                name="name"
                value={petData.name}
                onChange={handlePetDataChange}
                className="input-field"
              />
            </div>
            <div className="pet-info-field">
              <label>Especie:</label>
              <input
                type="text"
                name="species"
                value={petData.species}
                onChange={handlePetDataChange}
                className="input-field"
              />
            </div>
            <div className="pet-info-field">
              <label>Peso (kg):</label>
              <input
                type="text"
                name="weight"
                value={petData.weight}
                onChange={handlePetDataChange}
                className="input-field"
              />
            </div>
            <div className="pet-info-field">
              <label>Edad:</label>
              <input
                type="text"
                name="age"
                value={petData.age}
                onChange={handlePetDataChange}
                className="input-field"
              />
            </div>
            <div className="pet-info-actions">
              <button className="save-button" onClick={handleSavePetInfo}>
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <>
            <p>
              <strong>Mascota:</strong> {petData.name}
            </p>
            <p>
              <strong>Especie:</strong> {petData.species}
            </p>
            <p>
              <strong>Peso:</strong> {petData.weight}
            </p>
            <p>
              <strong>Edad:</strong> {petData.age}
            </p>
          </>
        )}
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
                <tr key={record.id || Math.random()}>
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
                  No hay registros. Haz clic en "Agregar Registro" para comenzar.
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
                    <strong>Mascota:</strong> {petData.name}
                  </p>
                  <p>
                    <strong>Especie:</strong> {petData.species}
                  </p>
                  <p>
                    <strong>Peso:</strong> {petData.weight}
                  </p>
                  <p>
                    <strong>Edad:</strong> {petData.age}
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
                    <tr key={record.id || Math.random()}>
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