import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import supabase from "../supabase";
import { User } from "@supabase/supabase-js";
import { Html5QrcodeScanner } from "html5-qrcode";
import BackButton from "../components/BackButton";
import AlertMessage from "../components/AlertMessage";
import "../styles/Nfc.css";

import {
  FaDog,
  FaUserAlt,
  FaExclamationCircle,
  FaMicrochip,
  FaQrcode,
} from "react-icons/fa";

// Interfaces de datos (sin cambios)
interface PetInfo {
  petname: string;
  pettype: string;
  petbreed: string;
  petconditions: string;
  petpartsigns: string;
}

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  othercontact: string;
}

const Nfc: React.FC = () => {
  // El 'tagId' de la URL ahora solo se usa para mostrar un ID específico si existe.
  const { id: tagId } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [localUserId, setLocalUserId] = useState<number | null>(null);

  // **NUEVO**: Almacenará el ID del perfil de contacto del usuario una vez cargado o creado.
  const [profileId, setProfileId] = useState<number | null>(
    tagId ? parseInt(tagId, 10) : null
  );

  // Estados del componente (sin cambios)
  const [hasNfc, setHasNfc] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalView, setModalView] = useState<"select" | "qr" | "nfc">("select");
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Estados del formulario (sin cambios)
  const [petInfo, setPetInfo] = useState<PetInfo>({
    petname: "",
    pettype: "",
    petbreed: "",
    petconditions: "",
    petpartsigns: "",
  });
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phone: "",
    email: "",
    address: "",
    othercontact: "",
  });

  // Helper para obtener el ID numérico del usuario desde la tabla 'users'
  const getLocalUserId = async (authUuid: string): Promise<number | null> => {
    const { data, error } = await supabase
      .from("Users")
      .select("id")
      .eq("id", authUuid) // Asumo que la columna que guarda el UUID se llama así
      .single();

    if (error) {
      console.error("Error fetching local user ID:", error);
      return null;
    }
    return data?.id || null;
  };

  // **MODIFICADO**: La inicialización ahora se basa en el usuario, no en el ID de la URL.
  useEffect(() => {
    if ("NDEFReader" in window) {
      setHasNfc(true);
    }

    const initialize = async () => {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const numericId = await getLocalUserId(user.id);
        if (!numericId) {
          setAlert({
            message: "No se pudo verificar tu usuario.",
            type: "error",
          });
          setIsLoading(false);
          return;
        }
        setLocalUserId(numericId);

        // Intenta cargar el perfil de contacto existente usando el user_id.
        const { data, error } = await supabase
          .from("pettag_contactinfo")
          .select("*")
          .eq("user_id", numericId)
          .single();

        if (data) {
          // Si se encuentra, rellena el formulario y guarda el ID del perfil.
          setPetInfo({
            petname: data.petname || "",
            pettype: data.pettype || "",
            petbreed: data.petbreed || "",
            petconditions: data.petconditions || "",
            petpartsigns: data.petpartsigns || "",
          });
          setContactInfo({
            phone: data.phone?.toString() || "", // Convertir a string para el input
            email: data.email || "",
            address: data.address || "",
            othercontact: data.othercontact || "",
          });
          setProfileId(data.id); // Guarda el ID del perfil existente.
        }

        if (error && error.code !== "PGRST116") {
          // Ignora el error "no rows found"
          setAlert({
            message: "Error al cargar tu perfil de contacto.",
            type: "error",
          });
        }
      }
      setIsLoading(false);
    };

    initialize();
  }, []);

  // Lógica del escáner QR (sin cambios)
  useEffect(() => {
    if (modalView === "qr" && isModalOpen && !scanResult) {
      const scanner = new Html5QrcodeScanner(
        "qr-scanner-container",
        { qrbox: { width: 250, height: 250 }, fps: 5 },
        false
      );
      const onScanSuccess = (result: string) => {
        scanner.clear();
        setScanResult(result);
        setAlert({
          message: `Placa con QR vinculada exitosamente.`,
          type: "success",
        });
      };
      scanner.render(onScanSuccess, () => {});
      return () => {
        scanner.clear().catch(() => {});
      };
    }
  }, [modalView, isModalOpen, scanResult]);

  // Manejadores de cambio del formulario (sin cambios)
  const handlePetInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setPetInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // **MODIFICADO**: La función de guardado ahora usa el user_id.
  const saveData = async (): Promise<boolean> => {
    if (!user || !localUserId) {
      setAlert({
        message: "Debes iniciar sesión para guardar.",
        type: "error",
      });
      return false;
    }
    setIsLoading(true);
    setAlert(null);

    const phoneAsNumber = parseInt(contactInfo.phone, 10);
    if (isNaN(phoneAsNumber)) {
      setAlert({
        message: "El número de teléfono no es válido.",
        type: "error",
      });
      setIsLoading(false);
      return false;
    }

    const dataToSave = {
      id: profileId,
      user_id: localUserId,
      ...petInfo,
      ...contactInfo,
      phone: phoneAsNumber,
    };

    // `upsert` creará un nuevo registro o actualizará el existente.
    const { data, error } = await supabase
      .from("pettag_contactinfo")
      .upsert(dataToSave)
      .select()
      .single();

    setIsLoading(false);

    if (error) {
      console.error("Error al guardar:", error);
      setAlert({ message: "Error al guardar la información.", type: "error" });
      return false;
    }

    if (data) {
      // **IMPORTANTE**: Actualiza el ID del perfil después de guardarlo por primera vez.
      setProfileId(data.id);
    }
    return true;
  };

  // Maneja el clic del botón "Guardar Cambios"
  const handleSaveOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await saveData();
    if (success) {
      setAlert({
        message: "Información guardada correctamente.",
        type: "success",
      });
    }
  };

  // **MODIFICADO**: El modal de vinculación ahora depende de que exista un `profileId`.
  const handleOpenModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    if (form.checkValidity()) {
      const success = await saveData();
      if (success && profileId) {
        // Solo abre el modal si se guardó y tenemos un ID de perfil.
        setAlert({
          message: "Perfil guardado. Ahora puedes vincular una placa.",
          type: "success",
        });
        setIsModalOpen(true);
        setModalView("select");
      } else if (!profileId) {
        setAlert({
          message: "No se pudo obtener un ID de perfil para vincular.",
          type: "error",
        });
      }
    } else {
      form.reportValidity();
    }
  };

  // **MODIFICADO**: La escritura NFC ahora usa el `profileId` del estado.
  const writeNfcTag = async () => {
    if (!hasNfc) {
      setAlert({ message: "Tu dispositivo no soporta NFC.", type: "error" });
      return;
    }
    setAlert({
      message: "Acerca la etiqueta NFC para escribir...",
      type: "success",
    });
    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.write({
        records: [
          {
            recordType: "url",
            data: `https://petconnectmx.netlify.app/nfc/${profileId}`, // Usa el ID del perfil.
          },
        ],
      });
      setAlert({
        message: "¡Etiqueta NFC escrita exitosamente!",
        type: "success",
      });
    } catch (error) {
      setAlert({
        message: "No se pudo escribir en la etiqueta NFC.",
        type: "error",
      });
    }
  };

  // Renderizado del componente (JSX)
  return (
    <div className="nfc-root">
      <BackButton />
      <div className="nfc-page-container">
        <div
          className="nfc-status-banner"
          style={{
            background: hasNfc
              ? "var(--accent-positive-bg)"
              : "var(--accent-negative-bg)",
            color: hasNfc
              ? "var(--accent-positive-text)"
              : "var(--accent-negative-text)",
          }}
        >
          {hasNfc ? (
            <span>
              <FaMicrochip
                style={{ verticalAlign: "middle", marginRight: 8 }}
              />
              Tu dispositivo soporta NFC
            </span>
          ) : (
            <span>
              <FaExclamationCircle
                style={{ verticalAlign: "middle", marginRight: 8 }}
              />
              Este dispositivo no soporta NFC
            </span>
          )}
        </div>
        <div className="nfc-form-container">
          <h1>
            <FaUserAlt style={{ verticalAlign: "middle", marginRight: 8 }} />
            Perfil de Contacto de Emergencia
          </h1>
          <p className="nfc-id">
            {profileId
              ? `ID de Perfil: ${profileId}`
              : "Crea tu perfil para obtener un ID."}
          </p>

          {alert && (
            <AlertMessage
              message={alert.message}
              type={alert.type}
              onClose={() => setAlert(null)}
            />
          )}

          <form onSubmit={handleOpenModal} className="nfc-form">
            {/* Secciones del formulario (sin cambios en los inputs) */}
            <section className="nfc-section">
              <h2 className="nfc-section-title">
                <FaDog style={{ verticalAlign: "middle", marginRight: 8 }} />
                Información de la Mascota
              </h2>
              {/* Inputs para petname, pettype, etc. */}
              <div className="nfc-form-group">
                <label htmlFor="petname">Nombre de la mascota</label>
                <input
                  id="petname"
                  type="text"
                  name="petname"
                  value={petInfo.petname}
                  onChange={handlePetInfoChange}
                  placeholder="Nombre de la mascota"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="nfc-form-group">
                <label htmlFor="pettype">Tipo de animal</label>
                <input
                  id="pettype"
                  type="text"
                  name="pettype"
                  value={petInfo.pettype}
                  onChange={handlePetInfoChange}
                  placeholder="Tipo de animal"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="nfc-form-group">
                <label htmlFor="petbreed">Raza</label>
                <input
                  id="petbreed"
                  type="text"
                  name="petbreed"
                  value={petInfo.petbreed}
                  onChange={handlePetInfoChange}
                  placeholder="Raza"
                  autoComplete="off"
                />
              </div>
              <div className="nfc-form-group">
                <label htmlFor="petconditions">
                  Condiciones médicas o especiales
                </label>
                <textarea
                  id="petconditions"
                  name="petconditions"
                  value={petInfo.petconditions}
                  onChange={handlePetInfoChange}
                  placeholder="Condiciones médicas o especiales"
                />
              </div>
              <div className="nfc-form-group">
                <label htmlFor="petpartsigns">Señas particulares</label>
                <textarea
                  id="petpartsigns"
                  name="petpartsigns"
                  value={petInfo.petpartsigns}
                  onChange={handlePetInfoChange}
                  placeholder="Señas particulares"
                />
              </div>
            </section>
            <section className="nfc-section">
              <h2 className="nfc-section-title">
                <FaUserAlt
                  style={{ verticalAlign: "middle", marginRight: 8 }}
                />
                Información de Contacto
              </h2>
              {/* Inputs para phone, email, etc. */}
              <div className="nfc-form-group">
                <label htmlFor="phone">Teléfono</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={contactInfo.phone}
                  onChange={handleContactInfoChange}
                  placeholder="Teléfono"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="nfc-form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={contactInfo.email}
                  onChange={handleContactInfoChange}
                  placeholder="Email"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="nfc-form-group">
                <label htmlFor="address">Dirección</label>
                <input
                  id="address"
                  type="text"
                  name="address"
                  value={contactInfo.address}
                  onChange={handleContactInfoChange}
                  placeholder="Dirección"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="nfc-form-group">
                <label htmlFor="othercontact">
                  Otro método de contacto (ej: Instagram)
                </label>
                <input
                  id="othercontact"
                  type="text"
                  name="othercontact"
                  value={contactInfo.othercontact}
                  onChange={handleContactInfoChange}
                  placeholder="Otro método de contacto (ej: Instagram)"
                  autoComplete="off"
                />
              </div>
            </section>

            <div className="nfc-button-container">
              <button
                type="button"
                className="nfc-button-secondary"
                disabled={isLoading}
                onClick={handleSaveOnly}
              >
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </button>
              <button
                type="submit"
                className="nfc-button"
                disabled={isLoading || !profileId}
              >
                {isLoading ? "Guardando..." : "Vincular Placa"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal (sin cambios en la estructura, pero la lógica que lo llama sí cambió) */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalView === "select"
                  ? "Vincular Placa"
                  : modalView === "qr"
                  ? "Escanear QR"
                  : "Acercar Placa NFC"}
              </h2>
              <button
                className="modal-close-button"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {modalView === "select" && (
                <div className="link-options">
                  <button onClick={() => setModalView("qr")}>
                    <FaQrcode /> Escanear QR
                  </button>
                  {hasNfc && (
                    <button
                      onClick={() => {
                        setModalView("nfc");
                        writeNfcTag();
                      }}
                    >
                      <FaMicrochip /> Escribir en NFC
                    </button>
                  )}
                </div>
              )}
              {modalView === "qr" && !scanResult && (
                <div id="qr-scanner-container"></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nfc;
