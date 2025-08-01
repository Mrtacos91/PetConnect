import React, { useState, useEffect } from "react";
import supabase from "../supabase";
import { User } from "@supabase/supabase-js";
import {
  getCurrentUser,
  getLocalUserId as getLocalUserIdFromService,
} from "../services/pet-service";
import "../styles/NfcLink.css";

interface NfcLinkProps {
  onLinkSuccess?: (url: string) => void;
  onClose?: () => void;
  readOnly?: boolean;
}

const NfcLink: React.FC<NfcLinkProps> = ({
  onLinkSuccess,
  onClose,
  readOnly = false,
}) => {
  const [status, setStatus] = useState<
    "idle" | "reading" | "success" | "error"
  >("idle");
  const [nfcUrl, setNfcUrl] = useState<string>("");
  const [alert, setAlert] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  // Check NFC support and get user data on component mount
  useEffect(() => {
    const checkNfcSupport = async () => {
      if ("NDEFReader" in window) {
        setIsSupported(true);
      } else {
        setAlert({
          message:
            "Tu navegador no soporta la API Web NFC. Prueba con Chrome en Android.",
          type: "error",
        });
      }
    };

    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (currentUser?.email) {
          const userId = await getLocalUserIdFromService(currentUser.email);
          if (userId) setLocalUserId(userId);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setAlert({
          message:
            "Error al cargar la información del usuario. Por favor, recarga la página.",
          type: "error",
        });
      }
    };

    checkNfcSupport();
    loadUser();

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Function to update URL in the database
  const updateUrlInDatabase = async (url: string): Promise<boolean> => {
    // In readOnly mode, we don't update the database
    if (readOnly) return true;

    if (!localUserId) {
      setAlert({
        message:
          "No se pudo identificar tu cuenta. Por favor, inicia sesión nuevamente.",
        type: "error",
      });
      return false;
    }

    try {
      // Check if URL is already assigned to another user
      const { data: existing, error: checkError } = await supabase
        .from("pettag_contactinfo")
        .select("user_id, id")
        .eq("url_asigned", url)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw checkError;
      }

      if (existing && existing.user_id !== localUserId) {
        setAlert({
          message:
            "Esta URL ya está vinculada a otro perfil. Debes desvincularla primero antes de asignarla a tu mascota.",
          type: "error",
        });
        return false;
      }

      // Update the URL in the database
      const { error: updateError } = await supabase
        .from("pettag_contactinfo")
        .upsert(
          {
            user_id: localUserId,
            url_asigned: url,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error("Error updating URL in database:", error);
      setAlert({
        message: "Error al actualizar la URL. Por favor, inténtalo de nuevo.",
        type: "error",
      });
      return false;
    }
  };

  // Start NFC reading
  const startNfcReading = async () => {
    if (!isSupported) {
      setAlert({
        message:
          "La lectura de NFC no es compatible con tu navegador o dispositivo.",
        type: "error",
      });
      return;
    }

    // In readOnly mode, we don't need to check user authentication
    if (!readOnly && (!user || !localUserId)) {
      setAlert({
        message: "Debes iniciar sesión para vincular una etiqueta NFC.",
        type: "error",
      });
      return;
    }

    setStatus("reading");
    setAlert(null);
    setNfcUrl("");

    try {
      // @ts-ignore - NDEFReader is not in TypeScript's default types
      const ndef = new NDEFReader();

      ndef.addEventListener("readingerror", () => {
        setStatus("error");
        setAlert({
          message:
            "Error al leer la etiqueta NFC. Asegúrate de que la etiqueta esté cerca del dispositivo.",
          type: "error",
        });
      });

      ndef.addEventListener("reading", async ({ message }: any) => {
        try {
          for (const record of message.records) {
            let url = "";

            if (record.recordType === "url") {
              const decoder = new TextDecoder();
              url = decoder.decode(record.data);
            } else if (record.recordType === "text") {
              const decoder = new TextDecoder();
              const text = decoder.decode(record.data);
              if (text.startsWith("http://") || text.startsWith("https://")) {
                url = text;
              }
            }

            if (url) {
              setNfcUrl(url);
              setStatus("success");

              // Update the URL in the database
              const success = await updateUrlInDatabase(url);
              if (success && onLinkSuccess) {
                onLinkSuccess(url);
              }

              // Stop reading after successful read
              try {
                await ndef.stop();
              } catch (e) {
                console.warn("Error stopping NFC reader:", e);
              }
              break;
            }
          }
        } catch (error) {
          console.error("Error processing NFC record:", error);
          setStatus("error");
          setAlert({
            message: "Error al procesar la etiqueta NFC. Intenta de nuevo.",
            type: "error",
          });
        }
      });

      await ndef.scan();

      // Set a timeout in case reading takes too long
      setTimeout(() => {
        if (status === "reading") {
          setStatus("error");
          setAlert({
            message:
              "No se detectó ninguna etiqueta NFC. Asegúrate de que la etiqueta esté cerca del dispositivo.",
            type: "error",
          });
          try {
            ndef.stop();
          } catch (e) {
            console.warn("Error stopping NFC reader:", e);
          }
        }
      }, 30000); // 30 seconds timeout
    } catch (error) {
      console.error("Error starting NFC reading:", error);
      setStatus("error");
      setAlert({
        message:
          "Error al iniciar la lectura NFC. Asegúrate de tener los permisos necesarios.",
        type: "error",
      });
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "reading":
        return "Acerca la etiqueta NFC al dispositivo...";
      case "success":
        return "¡Etiqueta NFC leída exitosamente!";
      case "error":
        return "Error al leer la etiqueta NFC";
      default:
        return "Presiona el botón para comenzar a leer una etiqueta NFC";
    }
  };

  return (
    <div className="nfc-link-container">
      <h2>{readOnly ? "Leer Etiqueta NFC" : "Vincular Etiqueta NFC"}</h2>

      {alert && <div className={`alert ${alert.type}`}>{alert.message}</div>}

      <div className="nfc-status">
        <div className={`status-indicator ${status}`}>
          {status === "reading" && <div className="spinner"></div>}
          {status === "success" && <div className="success-icon">✓</div>}
          {status === "error" && <div className="error-icon">✕</div>}
        </div>
        <p className="status-message">
          {readOnly
            ? status === "success"
              ? "¡Etiqueta leída con éxito!"
              : "Acerca una etiqueta NFC para leer su URL"
            : getStatusMessage()}
        </p>
      </div>

      {nfcUrl && (
        <div className="nfc-url-display">
          <p>URL detectada:</p>
          <div className="url-box">
            <code>{nfcUrl}</code>
            {readOnly && (
              <button
                className="btn-copy-url"
                onClick={() => {
                  navigator.clipboard.writeText(nfcUrl);
                  setAlert({
                    message: "URL copiada al portapapeles",
                    type: "success",
                  });
                }}
                title="Copiar URL"
              >
                📋
              </button>
            )}
          </div>
        </div>
      )}

      <div className="button-group">
        <button
          onClick={startNfcReading}
          disabled={status === "reading" || !isSupported}
          className={`btn btn-primary ${status === "reading" ? "loading" : ""}`}
        >
          {status === "reading"
            ? "Leyendo..."
            : readOnly
            ? "Leer Etiqueta NFC"
            : "Vincular Etiqueta NFC"}
        </button>

        {onClose && (
          <button onClick={onClose} className="btn btn-secondary">
            Cerrar
          </button>
        )}
      </div>

      {!isSupported && (
        <div className="browser-warning">
          <p>
            La funcionalidad NFC solo está disponible en dispositivos y
            navegadores compatibles.
          </p>
          <p>Recomendamos usar Chrome en dispositivos Android.</p>
        </div>
      )}
    </div>
  );
};

export default NfcLink;
