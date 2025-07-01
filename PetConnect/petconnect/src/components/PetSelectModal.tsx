import React, { useEffect, useState } from "react";
import "../styles/ConfDevice.css";
import { FaTimes, FaPaw } from "react-icons/fa";
import {
  getCurrentUser,
  getLocalUserId,
  getAllPetsByUserId,
  PetData,
} from "../services/pet-service";
import supabase from "../supabase";

interface PetSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
}

const PetSelectModal: React.FC<PetSelectModalProps> = ({
  isOpen,
  onClose,
  deviceId,
}) => {
  const [pets, setPets] = useState<PetData[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Cargar las mascotas del usuario y verificar cuál tiene asignado el dispositivo
  useEffect(() => {
    if (!isOpen) return;

    const fetchPetsAndLinkedPet = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const user = await getCurrentUser();
        if (!user) {
          setMessage("Debes iniciar sesión.");
          return;
        }
        const localId = await getLocalUserId(user.email!);
        if (!localId) {
          setMessage("Usuario no encontrado.");
          return;
        }
        
        // Obtener la lista de mascotas
        const petList = await getAllPetsByUserId(localId);
        setPets(petList);
        
        // Buscar si alguna mascota ya tiene este dispositivo asignado
        const { data: linkedPet } = await supabase
          .from("Pets")
          .select("id")
          .eq("device_id", deviceId)
          .single();
        
        // Establecer la mascota seleccionada (si hay una vinculada, la selecciona; si no, la primera de la lista)
        if (linkedPet?.id) {
          setSelectedPetId(linkedPet.id);
        } else if (petList.length > 0) {
          setSelectedPetId(petList[0].id || null);
        }
      } catch (error) {
        console.error("Error cargando mascotas:", error);
        setMessage("Error cargando mascotas.");
      } finally {
        setLoading(false);
      }
    };

    fetchPetsAndLinkedPet();
  }, [isOpen, deviceId]);

  // Vincular el dispositivo a la mascota seleccionada
  const handleSave = async () => {
    if (!selectedPetId) return;
    
    // Si la mascota seleccionada ya tiene este dispositivo asignado, no hacer nada
    const selectedPet = pets.find(pet => pet.id === selectedPetId);
    if (selectedPet?.device_id === deviceId) {
      setMessage("Esta mascota ya tiene asignado este dispositivo.");
      return;
    }
    
    setSaving(true);
    setMessage(null);
    try {
      // Limpiar cualquier vínculo previo para este dispositivo
      const { error: clearError } = await supabase
        .from("Pets")
        .update({ device_id: null })
        .eq("device_id", deviceId);

      if (clearError) throw clearError;

      // Asignar el dispositivo a la mascota seleccionada
      const { error } = await supabase
        .from("Pets")
        .update({ device_id: deviceId })
        .eq("id", selectedPetId);

      if (error) throw error;

      // Actualizar el estado local para reflejar el cambio
      setPets(pets.map(pet => 
        pet.id === selectedPetId 
          ? { ...pet, device_id: deviceId } 
          : { ...pet, device_id: pet.device_id === deviceId ? null : pet.device_id }
      ));

      setMessage("¡Dispositivo vinculado correctamente!");
      // Cerrar modal tras breve confirmación
      setTimeout(() => {
        onClose();
        // Recargar la página para actualizar los datos
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error al vincular dispositivo:", error);
      setMessage("Error al vincular dispositivo.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="confdevice-overlay">
      <div className="confdevice-modal">
        <div className="confdevice-header">
          <h2>ASIGNAR COLLAR A MASCOTA</h2>
          <button className="confdevice-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="confdevice-content">
          {loading ? (
            <p>Cargando mascotas...</p>
          ) : pets.length === 0 ? (
            <p>No tienes mascotas registradas. Ve a Personalizar para añadir una.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {pets.map((pet) => (
                <li
                  key={pet.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px",
                    marginBottom: "8px",
                    cursor: "pointer",
                    background:
                      pet.device_id === deviceId
                        ? "rgba(46, 204, 113, 0.2)" // Verde más suave para la mascota vinculada
                        : selectedPetId === pet.id
                        ? "rgba(255,255,255,0.1)" // Gris claro para la seleccionada
                        : "transparent",
                    border:
                      pet.device_id === deviceId
                        ? "1px solid #2ecc71" // Borde verde para la mascota vinculada
                        : "1px solid transparent",
                    borderRadius: "6px",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => setSelectedPetId(pet.id!)}
                >
                  <FaPaw 
                    style={{ 
                      color: pet.device_id === deviceId ? "#2ecc71" : "inherit" 
                    }} 
                  />
                  <span>{pet.pet_name}
                    {pet.device_id === deviceId && (
                      <span style={{
                        fontSize: '0.8em',
                        marginLeft: '8px',
                        color: '#2ecc71',
                        fontWeight: 'bold'
                      }}>
                        (Vinculada)
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <button
            className="confdevice-submit-btn"
            style={{ marginTop: "16px" }}
            disabled={!selectedPetId || saving}
            onClick={handleSave}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>

          {message && <p style={{ marginTop: "10px" }}>{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default PetSelectModal;
