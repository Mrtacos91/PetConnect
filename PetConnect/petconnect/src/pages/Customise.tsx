import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import MenuButton from "../components/MenuButton";
import "../styles/Customise.css";

const Customise: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [petName, setPetName] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petAge, setPetAge] = useState("");
  const [petPhoto, setPetPhoto] = useState<File | null>(null);

  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPetPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí agregarías la lógica para actualizar los datos del usuario en Supabase o en tu backend.
    console.log({
      petName,
      petBreed,
      petAge,
      petPhoto,
    });
    alert("Cambios guardados");
    // Opcional: redirige a otra página, por ejemplo:
    // navigate("/dashboard");
  };

  return (
    <div className="dashboard customise-page">
      {/* Botón del menú siempre visible */}
      <MenuButton isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Sidebar siempre visible */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* Botón para regresar a /dashboard */}
      <button className="back-button" onClick={() => navigate("/dashboard")}>
        &#8592; Volver
      </button>

      {/* Contenedor principal de personalización */}
      <main className="content">
        <div className="customise-container">
          <h1>Personaliza tu mascota</h1>
          <form className="customise-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="petPhoto">Cambiar foto</label>
              <input
                type="file"
                id="petPhoto"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="petName">Nombre</label>
              <input
                type="text"
                id="petName"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Nuevo nombre"
              />
            </div>
            <div className="form-group">
              <label htmlFor="petBreed">Raza</label>
              <input
                type="text"
                id="petBreed"
                value={petBreed}
                onChange={(e) => setPetBreed(e.target.value)}
                placeholder="Nueva raza"
              />
            </div>
            <div className="form-group">
              <label htmlFor="petAge">Edad</label>
              <input
                type="number"
                id="petAge"
                value={petAge}
                onChange={(e) => setPetAge(e.target.value)}
                placeholder="Edad en años"
              />
            </div>
            <button type="submit" className="save-button">
              Guardar cambios
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Customise;
