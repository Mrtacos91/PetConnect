import React, { useState, useEffect, useRef } from "react";
import "../styles/LinkDevice.css";
import { FaLink, FaQrcode } from "react-icons/fa";
import ConfigureDevice from "./ConfigureDevice";
import supabase from "../supabase";

interface LinkDeviceProps {}

const LinkDevice: React.FC<LinkDeviceProps> = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [showConfigPopup, setShowConfigPopup] = useState(false);

  // Referencia para almacenar el ID del dispositivo anterior
  const prevDeviceId = useRef<string | null>(null);
  
  // Efecto para cargar el ID del dispositivo al montar el componente
  useEffect(() => {
    fetchDeviceId();
    
    // Configurar un intervalo para verificar actualizaciones cada 5 minutos
    const interval = setInterval(fetchDeviceId, 300000); // 5 minutos
    
    return () => clearInterval(interval);
  }, []);

  // Función para obtener el ID del dispositivo del usuario actual
  const fetchDeviceId = async () => {
    try {
      // Solo establecer isLoading a true en la primera carga
      if (deviceId === null && isLoading === false) {
        setIsLoading(true);
      }

      // Obtener la sesión del usuario
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.error("No hay sesión activa");
        setIsLoading(false);
        return;
      }

      // Obtener el ID del dispositivo del usuario
      const { data: userData, error: userError } = await supabase
        .from("Users")
        .select("device")
        .eq("email", session.user.email)
        .single();

      if (userError) {
        console.error("Error obteniendo datos del usuario:", userError);
      } else if (userData) {
        // Verificar si el ID del dispositivo ha cambiado
        if (prevDeviceId.current !== userData.device) {
          console.log("ID del dispositivo actualizado:", userData.device);
          setDeviceId(userData.device);
          prevDeviceId.current = userData.device;
        }
      }
    } catch (error) {
      console.error("Error en fetchDeviceId:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para abrir el popup de configuración
  const handleOpenConfigPopup = () => {
    setShowConfigPopup(true);
  };

  // Función para manejar el éxito en la configuración del dispositivo
  const handleDeviceConfigured = (newDeviceId: string) => {
    setDeviceId(newDeviceId);
    setShowConfigPopup(false);
    // Recargar los datos del dispositivo
    fetchDeviceId();
  };

  return (
    <div className="highlight-container-linkdevice">
      <h2 className="highlight-title-linkdevice">Dispositivo GPS</h2>

      {isLoading ? (
        // Skeleton Loader
        <div className="skeleton-container-linkdevice">
          <div className="skeleton skeleton-button-linkdevice"></div>
          <div className="skeleton skeleton-text-linkdevice"></div>
          <div className="skeleton skeleton-text-linkdevice"></div>
        </div>
      ) : (
        // Contenido real
        <div className="linkdevice-card">
          <div className="linkdevice-card__header">
            <button
              className="linkdevice-card__button"
              onClick={handleOpenConfigPopup}
            >
              {deviceId ? "Cambiar dispositivo" : "Configurar dispositivo"}{" "}
              <FaLink />
            </button>
          </div>

          {/* Información del dispositivo */}
          <div className="linkdevice-card__info">
            {deviceId ? (
              <>
                <p>
                  <FaQrcode /> <strong>Dispositivo conectado:</strong>
                </p>
                <p className="device-id">{deviceId}</p>
                <p>
                  ✅ <strong>Estado:</strong> Activo y funcionando
                </p>
              </>
            ) : (
              <>
                <p>
                  ⚠️ <strong>No hay dispositivo configurado</strong>
                </p>
                <p>
                  Conecta tu collar GPS para poder rastrear a tu mascota en
                  tiempo real.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Popup de configuración */}
      <ConfigureDevice
        isOpen={showConfigPopup}
        onClose={() => setShowConfigPopup(false)}
        onSuccess={handleDeviceConfigured}
      />
    </div>
  );
};

export default LinkDevice;
