import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import BackButton from "../components/BackButton";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/Nfc.css";

import {
  FaDog,
  FaUserAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaMicrochip,
  FaQrcode,
} from "react-icons/fa";

interface PetInfo {
  nombre: string;
  tipoAnimal: string;
  raza: string;
  condiciones: string;
  senasParticulares: string;
}

interface ContactInfo {
  telefono: string;
  email: string;
  direccion: string;
  otroContacto: string;
}

const Nfc: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [hasNfc, setHasNfc] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalView, setModalView] = useState<"select" | "qr" | "nfc">("select");
  const [petInfo, setPetInfo] = useState<PetInfo>({
    nombre: "",
    tipoAnimal: "",
    raza: "",
    condiciones: "",
    senasParticulares: "",
  });
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    telefono: "",
    email: "",
    direccion: "",
    otroContacto: "",
  });
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if ("NDEFReader" in window) {
      setHasNfc(true);
    }
    loadExistingData();
  }, [id]);

  const loadExistingData = async () => {
    setIsLoading(false);
  };

  const handlePetInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPetInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactInfo((prev) => ({ ...prev, [name]: value }));
  };

  const saveData = async () => {
    setIsLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      console.log("Información guardada:", { id, petInfo, contactInfo });
      setSuccessMsg("Información guardada. Ahora puedes vincularla.");
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error al guardar información:", error);
      setErrorMsg("Error al guardar la información");
      setIsLoading(false);
      return false;
    }
  };

  const handleOpenModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    if (form.checkValidity()) {
      const success = await saveData();
      if (success) {
        setIsModalOpen(true);
        setModalView("select");
      }
    } else {
      form.reportValidity();
    }
  };

  const writeNfcTag = async () => {
    if (!hasNfc) {
      setErrorMsg("Tu dispositivo no soporta NFC.");
      return;
    }
    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.write({
        records: [
          {
            recordType: "url",
            data: `https://petconnectmx.netlify.app/nfc/${id}`,
          },
        ],
      });
      setSuccessMsg(
        "¡Etiqueta NFC escrita exitosamente! Acerca la etiqueta para escribir."
      );
    } catch (error) {
      console.error("Error al escribir en la etiqueta NFC:", error);
      setErrorMsg(
        "No se pudo escribir en la etiqueta NFC. Cancela e inténtalo de nuevo."
      );
    }
  };

  if (isLoading && !isModalOpen) {
    return (
      <div className="nfc-root">
        <div className="nfc-page-container">
          <div className="nfc-loader">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="nfc-root">
      <div className="nfc-page-container">
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <ThemeToggle />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <BackButton />
        </div>
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
            <FaMicrochip style={{ verticalAlign: "middle", marginRight: 8 }} />
            Vincular Información NFC/QR
          </h1>
          <p className="nfc-id">ID: {id}</p>

          {successMsg && (
            <div className="nfc-alert success">
              <FaCheckCircle style={{ marginRight: 6 }} />
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="nfc-alert error">
              <FaExclamationCircle style={{ marginRight: 6 }} />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleOpenModal} className="nfc-form">
            <section className="nfc-section">
              <h2 className="nfc-section-title">
                <FaDog style={{ verticalAlign: "middle", marginRight: 8 }} />
                Información de la Mascota
              </h2>
              <div className="nfc-form-group">
                <label htmlFor="nombre">Nombre de la mascota</label>
                <input
                  id="nombre"
                  type="text"
                  name="nombre"
                  value={petInfo.nombre}
                  onChange={handlePetInfoChange}
                  placeholder="Nombre de la mascota"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="nfc-form-group">
                <label htmlFor="tipoAnimal">Tipo de animal</label>
                <input
                  id="tipoAnimal"
                  type="text"
                  name="tipoAnimal"
                  value={petInfo.tipoAnimal}
                  onChange={handlePetInfoChange}
                  placeholder="Tipo de animal"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="nfc-form-group">
                <label htmlFor="raza">Raza</label>
                <input
                  id="raza"
                  type="text"
                  name="raza"
                  value={petInfo.raza}
                  onChange={handlePetInfoChange}
                  placeholder="Raza"
                  autoComplete="off"
                />
              </div>
              <div className="nfc-form-group">
                <label htmlFor="condiciones">
                  Condiciones médicas o especiales
                </label>
                <textarea
                  id="condiciones"
                  name="condiciones"
                  value={petInfo.condiciones}
                  onChange={handlePetInfoChange}
                  placeholder="Condiciones médicas o especiales"
                />
              </div>
              <div className="nfc-form-group">
                <label htmlFor="senasParticulares">Señas particulares</label>
                <textarea
                  id="senasParticulares"
                  name="senasParticulares"
                  value={petInfo.senasParticulares}
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
              <div className="nfc-form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  id="telefono"
                  type="tel"
                  name="telefono"
                  value={contactInfo.telefono}
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
                <label htmlFor="direccion">Dirección</label>
                <input
                  id="direccion"
                  type="text"
                  name="direccion"
                  value={contactInfo.direccion}
                  onChange={handleContactInfoChange}
                  placeholder="Dirección"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="nfc-form-group">
                <label htmlFor="otroContacto">
                  Otro método de contacto (ej: Instagram)
                </label>
                <input
                  id="otroContacto"
                  type="text"
                  name="otroContacto"
                  value={contactInfo.otroContacto}
                  onChange={handleContactInfoChange}
                  placeholder="Otro método de contacto (ej: Instagram)"
                  autoComplete="off"
                />
              </div>
            </section>

            <div className="nfc-options">
              <button type="submit" className="nfc-button" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar y Vincular"}
              </button>
            </div>
          </form>
        </div>
      </div>

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
                <>
                  <p>
                    Elige un método para vincular la información a tu placa.
                  </p>
                  <div className="modal-options-container">
                    <div
                      className="option-card"
                      onClick={() => setModalView("qr")}
                    >
                      <FaQrcode className="icon" />
                      <h3>Vincular con QR</h3>
                    </div>
                    {hasNfc && (
                      <div
                        className="option-card"
                        onClick={() => setModalView("nfc")}
                      >
                        <FaMicrochip className="icon" />
                        <h3>Vincular con NFC</h3>
                      </div>
                    )}
                  </div>
                </>
              )}
              {modalView === "qr" && (
                <div style={{ textAlign: "center" }}>
                  <p>Escanea este código QR con la cámara de tu celular.</p>
                  <div className="qr-code-container">
                    <QRCodeCanvas
                      value={`https://petconnectmx.netlify.app/nfc/${id}`}
                      size={256}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      level={"L"}
                      includeMargin={false}
                    />
                  </div>
                  <button
                    className="nfc-button"
                    style={{ marginTop: "1.5rem" }}
                    onClick={() => setModalView("select")}
                  >
                    Volver
                  </button>
                </div>
              )}
              {modalView === "nfc" && (
                <div style={{ textAlign: "center" }}>
                  <p>
                    Prepara tu placa NFC y presiona el botón para escribir la
                    información.
                  </p>
                  <button
                    className="nfc-button nfc-write-button"
                    onClick={writeNfcTag}
                  >
                    Escribir en Placa NFC
                  </button>
                  <button
                    className="nfc-button"
                    style={{
                      marginTop: "1rem",
                      background: "var(--text-secondary)",
                    }}
                    onClick={() => setModalView("select")}
                  >
                    Volver
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nfc;
