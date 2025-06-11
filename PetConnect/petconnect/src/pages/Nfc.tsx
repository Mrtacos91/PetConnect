import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import BackButton from "../components/BackButton";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/Nfc.css";

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

import {
  FaDog,
  FaUserAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaMicrochip,
} from "react-icons/fa";

const Nfc: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [hasNfc, setHasNfc] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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
    // Verificar si el dispositivo soporta NFC
    if ("NDEFReader" in window) {
      setHasNfc(true);
    }
    // Aquí podrías cargar la información existente si el ID ya está vinculado
    loadExistingData();
  }, [id]);

  const loadExistingData = async () => {
    try {
      // Aquí deberías hacer una llamada a tu API para obtener los datos existentes
      // const response = await fetch(`/api/nfc/${id}`);
      // const data = await response.json();
      // if (data) {
      //   setPetInfo(data.petInfo);
      //   setContactInfo(data.contactInfo);
      // }
      setIsLoading(false);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setIsLoading(false);
    }
  };

  const handlePetInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPetInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      // Aquí deberías hacer una llamada a tu API para guardar los datos
      // const response = await fetch(`/api/nfc/${id}`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     petInfo,
      //     contactInfo,
      //   }),
      // });

      // if (response.ok) {
      //   setSuccessMsg('Información vinculada exitosamente');
      // }
      setSuccessMsg("Información vinculada exitosamente (demo)");
      console.log("Información a vincular:", { id, petInfo, contactInfo });
    } catch (error) {
      console.error("Error al vincular información:", error);
      setErrorMsg("Error al vincular la información");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
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
              ? "var(--skeleton-gradient-start, #e9fbe9)"
              : "#ffeaea",
            color: hasNfc ? "var(--accent-color, #249e57)" : "#e74c3c",
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
            <FaMicrochip style={{ verticalAlign: "middle", marginRight: 8 }} />{" "}
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

          <form onSubmit={handleSubmit} className="nfc-form">
            <section className="nfc-section">
              <h2 className="nfc-section-title">
                <FaDog style={{ verticalAlign: "middle", marginRight: 8 }} />{" "}
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
                />{" "}
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
                {isLoading ? "Vinculando..." : "Vincular Información"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Nfc;
