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

  // Cargar las mascotas del usuario cuando se abra el modal
  useEffect(() => {
    if (!isOpen) return;

    const fetchPets = async () => {
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
        const petList = await getAllPetsByUserId(localId);
        setPets(petList);
        if (petList.length > 0) {
          setSelectedPetId(petList[0].id || null);
        }
      } catch (error) {
        console.error("Error cargando mascotas:", error);
        setMessage("Error cargando mascotas.");
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, [isOpen]);

  // Vincular el dispositivo a la mascota seleccionada
  const handleSave = async () => {
    if (!selectedPetId) return;
    setSaving(true);
    setMessage(null);
    try {
      // Limpiar cualquier vínculo previo para este dispositivo
      await supabase
        .from("Pets")
        .update({ device_id: null })
        .eq("device_id", deviceId);

      // Asignar el dispositivo a la mascota seleccionada
      const { error } = await supabase
        .from("Pets")
        .update({ device_id: deviceId })
        .eq("id", selectedPetId);

      if (error) throw error;

      setMessage("¡Dispositivo vinculado correctamente!");
      // Cerrar modal tras breve confirmación
      setTimeout(onClose, 1500);
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
                      selectedPetId === pet.id
                        ? "rgba(255,255,255,0.1)"
                        : "transparent",
                    borderRadius: "6px",
                  }}
                  onClick={() => setSelectedPetId(pet.id!)}
                >
                  <FaPaw /> <span>{pet.pet_name}</span>
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
