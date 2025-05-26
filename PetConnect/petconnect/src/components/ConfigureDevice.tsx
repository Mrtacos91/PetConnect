import React, { useState, useRef, useEffect } from "react";
import "../styles/ConfDevice.css";
import { FaTimes, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import supabase from "../supabase";
import jsQR from "jsqr";

interface ConfigureDeviceProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deviceId: string) => void;
}

const ConfigureDevice: React.FC<ConfigureDeviceProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<"scan" | "code">("scan");
  const [deviceCode, setDeviceCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "warning" | null;
    message: string;
  }>({ type: null, message: "" });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanInterval = useRef<number | null>(null);

  // Efecto para manejar la apertura/cierre del modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      stopScanner();
    }
    return () => {
      document.body.style.overflow = "auto";
      stopScanner();
    };
  }, [isOpen]);

  // Iniciar el escáner de QR
  const startScanner = async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Iniciar el proceso de escaneo
        scanInterval.current = window.setInterval(() => {
          captureAndDecode();
        }, 500);
      }
    } catch (error) {
      console.error("Error al acceder a la cámara:", error);
      setNotification({
        type: "error",
        message:
          "No se pudo acceder a la cámara. Por favor, verifica los permisos.",
      });
      setIsScanning(false);
    }
  };

  // Detener el escáner
  const stopScanner = () => {
    if (scanInterval.current) {
      clearInterval(scanInterval.current);
      scanInterval.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  // Capturar y decodificar el código QR
  const captureAndDecode = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Obtener los datos de la imagen
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Usar jsQR para decodificar
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        // Si se detecta un código QR
        if (qrCode) {
          console.log("¡QR detectado!", qrCode.data);

          // Verificar si el código tiene el formato esperado (puedes ajustar según tus necesidades)
          if (qrCode.data && qrCode.data.trim() !== "") {
            // Detener el escáner y procesar el código
            stopScanner();
            processDeviceCode(qrCode.data);
          }
        }
        // Si no se detecta un código, continuamos escaneando (el intervalo seguirá llamando a esta función)
      }
    }
  };

  // Procesar el código del dispositivo (ya sea escaneado o ingresado)
  const processDeviceCode = async (code: string) => {
    try {
      // Aquí normalmente verificarías el código con tu backend
      // Simulamos una verificación y asociación exitosa

      // Obtener la sesión del usuario actual
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setNotification({
          type: "error",
          message: "No hay sesión activa. Por favor, inicia sesión nuevamente.",
        });
        return;
      }

      // Actualizar el dispositivo asociado al usuario
      const { error } = await supabase
        .from("Users")
        .update({ device: code })
        .eq("email", session.user.email);

      if (error) {
        throw error;
      }

      setNotification({
        type: "success",
        message: "¡Dispositivo configurado correctamente!",
      });

      // Notificar al componente padre sobre el éxito
      setTimeout(() => {
        onSuccess(code);
      }, 2000);
    } catch (error) {
      console.error("Error al procesar el código:", error);
      setNotification({
        type: "error",
        message: "Error al configurar el dispositivo. Inténtalo nuevamente.",
      });
    }
  };

  // Manejar el envío del formulario de código
  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deviceCode.trim()) {
      processDeviceCode(deviceCode.trim());
    } else {
      setNotification({
        type: "warning",
        message: "Por favor, ingresa un código válido.",
      });
    }
  };

  // Si el modal no está abierto, no renderizamos nada
  if (!isOpen) return null;

  return (
    <div className="confdevice-overlay">
      <div className="confdevice-modal">
        <div className="confdevice-header">
          <h2>CONFIGURA TU COLLAR</h2>
          <button className="confdevice-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="confdevice-content">
          {notification.type && (
            <div className={`confdevice-notification ${notification.type}`}>
              <div className="notification-icon">
                {notification.type === "success" && <FaCheck />}
                {notification.type === "error" && <FaTimes />}
                {notification.type === "warning" && <FaExclamationTriangle />}
              </div>
              <div className="notification-text">{notification.message}</div>
              <div className="notification-progress-bar"></div>
            </div>
          )}

          <div className="confdevice-options">
            <div className="confdevice-divider">
              <div className="confdevice-option-container">
                <div
                  className={`confdevice-option ${mode === "scan" ? "active" : ""
                    }`}
                  onClick={() => {
                    setMode("scan");
                    setNotification({ type: null, message: "" });
                  }}
                >
                  <div className="confdevice-qr-container">
                    <img
                      src="/frame.png"
                      alt="QR Code"
                      className="confdevice-qr"
                    />
                  </div>
                  <p>Escanea tu collar</p>
                  {mode === "scan" && (
                    <button
                      className="confdevice-scan-btn"
                      onClick={isScanning ? stopScanner : startScanner}
                    >
                      {isScanning ? "Detener" : "Escanear QR"}
                    </button>
                  )}
                </div>
              </div>

              <div className="confdevice-separator">
                <div className="confdevice-line"></div>
                <span>O</span>
                <div className="confdevice-line"></div>
              </div>

              <div className="confdevice-option-container">
                <div
                  className={`confdevice-option ${mode === "code" ? "active" : ""
                    }`}
                  onClick={() => {
                    setMode("code");
                    setNotification({ type: null, message: "" });
                  }}
                >
                  <button className="confdevice-code-btn">
                    Ingresa un código
                  </button>

                  {mode === "code" && (
                    <form
                      onSubmit={handleCodeSubmit}
                      className="confdevice-code-form"
                    >
                      <input
                        type="text"
                        placeholder="Ingresa el código del collar"
                        value={deviceCode}
                        onChange={(e) => setDeviceCode(e.target.value)}
                        className="confdevice-code-input"
                      />
                      <button type="submit" className="confdevice-submit-btn">
                        Configurar
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Elementos para el escáner de QR */}
          <div className={`confdevice-scanner ${isScanning ? "active" : ""}`}>
            {isScanning && (
              <div className="confdevice-scanner-overlay">
                <div className="confdevice-scanner-header">
                  <h3>Escaneando código QR</h3>
                  <button
                    className="confdevice-close-scanner-btn"
                    onClick={stopScanner}
                  >
                    <FaTimes />
                  </button>
                </div>
                <div className="confdevice-scanner-content">
                  <div className="confdevice-scanner-frame">
                    <video
                      ref={videoRef}
                      className="confdevice-video"
                      playsInline
                    ></video>
                    <div className="confdevice-qr-marker"></div>
                  </div>
                  <p className="confdevice-scanner-instruction">
                    Apunta la cámara al código QR de tu collar
                  </p>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="confdevice-canvas"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigureDevice;
