import React, { useState, useEffect } from "react";
import { FaUnlink, FaExclamationTriangle, FaCheckCircle, FaTimes } from "react-icons/fa";
import supabase from "../supabase";
import { useNavigate } from "react-router-dom";
import "../styles/UnlinkGpsDevice.css";

interface UnlinkGpsDeviceProps {
  onUnlink?: () => void;
}

const UnlinkGpsDevice: React.FC<UnlinkGpsDeviceProps> = ({ onUnlink }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);

  // Verificar autenticación y obtener datos del usuario
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getUser();

        if (sessionError || !sessionData?.user) {
          console.error("Error de sesión:", sessionError);
          navigate("/login");
          return;
        }

        const { data: localUser, error: localUserError } = await supabase
          .from("Users")
          .select("id, device")
          .eq("email", sessionData.user.email)
          .single();

        if (localUserError) {
          console.error("Error al obtener el usuario local:", localUserError);
          return;
        }

        if (!localUser?.id) {
          console.error("No se encontró el usuario local");
          return;
        }

        setUserId(localUser.id);
        setCurrentDeviceId(localUser.device);
      } catch (e) {
        console.error("Error al identificar el usuario:", e);
      }
    };

    checkUser();
  }, [navigate]);

  const showNotification = (type: "success" | "error" | "warning", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleUnlinkDevice = async () => {
    if (!userId) {
      showNotification("error", "No hay usuario autenticado");
      return;
    }

    if (!currentDeviceId) {
      showNotification("warning", "No hay dispositivo GPS vinculado");
      return;
    }

    setIsLoading(true);
    try {
      // Actualizar el usuario para desvincular el dispositivo
      const { error } = await supabase
        .from("Users")
        .update({ device: null })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      // Limpiar el estado local
      setCurrentDeviceId(null);
      setShowConfirmModal(false);
      showNotification("success", "Dispositivo GPS desvinculado exitosamente");

      // Llamar callback si existe
      if (onUnlink) {
        onUnlink();
      }
    } catch (error: any) {
      console.error("Error al desvincular dispositivo:", error);
      showNotification("error", `Error al desvincular: ${error.message || "Error desconocido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openConfirmModal = () => {
    if (!currentDeviceId) {
      showNotification("warning", "No hay dispositivo GPS vinculado");
      return;
    }
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
  };

  return (
    <>
      <div className="unlink-gps-container" style={{ background: "var(--card-background)", color: "var(--text-primary)" }}>
        <div className="unlink-gps-card" style={{ background: "var(--card-background)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}>
          <div className="unlink-gps-header">
            <FaUnlink className="unlink-gps-icon" style={{ color: "var(--accent-color)" }} />
            <h3 className="unlink-gps-title">Desvincular GPS</h3>
          </div>

          <div className="unlink-gps-content">
            {currentDeviceId ? (
              <div className="device-info" style={{ background: "var(--card-background)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}>
                <span className="device-label">Dispositivo vinculado:</span>
                <span className="device-id-unlink">{currentDeviceId}</span>
              </div>
            ) : (
              <div className="no-device">
                <FaCheckCircle className="no-device-icon" style={{ color: "var(--accent-color)" }} />
                <p className="no-device-text">No hay dispositivo GPS vinculado</p>
              </div>
            )}
          </div>

          <div className="unlink-gps-actions">
            <button
              className={`unlink-gps-btn ${!currentDeviceId ? 'disabled' : ''}`}
              onClick={openConfirmModal}
              disabled={!currentDeviceId || isLoading}
              style={{ background: "var(--accent-color)", color: "var(--text-bottomnav)" }}
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <FaUnlink />
                  Desvincular
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div className="unlink-modal-overlay" onClick={closeConfirmModal}>
          <div className="unlink-modal" onClick={(e) => e.stopPropagation()} style={{ background: "var(--card-background)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}>
            <div className="unlink-modal-header">
              <h3>Confirmar Desvinculación</h3>
              <button className="unlink-modal-close" onClick={closeConfirmModal} style={{ color: "var(--text-secondary)" }}>
                <FaTimes />
              </button>
            </div>
            
            <div className="unlink-modal-content">
              <FaExclamationTriangle className="unlink-modal-warning-icon" style={{ color: "var(--accent-color)" }} />
              <p>¿Desvincular dispositivo GPS?</p>
              <p className="unlink-modal-device-id">{currentDeviceId}</p>
            </div>

            <div className="unlink-modal-actions">
              <button className="unlink-modal-cancel" onClick={closeConfirmModal} style={{ background: "var(--card-background)", color: "var(--text-secondary)", border: "1px solid var(--border-color)" }}>
                Cancelar
              </button>
              <button 
                className="unlink-modal-confirm" 
                onClick={handleUnlinkDevice}
                disabled={isLoading}
                style={{ background: "var(--accent-color)", color: "var(--text-bottomnav)" }}
              >
                {isLoading ? (
                  <div className="loading-spinner-small"></div>
                ) : (
                  "Sí, Desvincular"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificaciones */}
      {notification && (
        <div className={`unlink-notification ${notification.type}`} style={{ background: notification.type === 'success' ? 'var(--accent-color)' : notification.type === 'error' ? 'var(--border-color)' : 'var(--accent-color)', color: 'var(--text-bottomnav)' }}>
          <span className="notification-message">{notification.message}</span>
          <button 
            className="notification-close" 
            onClick={() => setNotification(null)}
          >
            <FaTimes />
          </button>
        </div>
      )}
    </>
  );
};

export default UnlinkGpsDevice;
