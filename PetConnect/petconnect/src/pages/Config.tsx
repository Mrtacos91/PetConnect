import React, { useState } from "react";
import "../styles/Config.css";
import BackButton from "../components/BackButton";

const Config: React.FC = () => {
  // Estado para los formularios
  const [theme, setTheme] = useState<string>(
    localStorage.getItem("theme") || "light"
  );
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [language, setLanguage] = useState<string>("es");
  const [notifications, setNotifications] = useState<boolean>(true);

  // Handlers simulados
  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedTheme = e.target.checked ? "dark" : "light";
    setTheme(selectedTheme);
    localStorage.setItem("theme", selectedTheme);
    document.body.classList.toggle("dark-mode", selectedTheme === "dark");
  };

  const handleUserSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar los datos del usuario
    alert("Datos de usuario guardados.");
  };

  const handlePreferencesSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar preferencias
    alert("Preferencias guardadas.");
  };

  const handleLogout = () => {
    // Aquí iría la lógica para cerrar sesión
    alert("Sesión cerrada.");
  };

  const handleDeleteAccount = () => {
    // Aquí iría la lógica para eliminar la cuenta
    if (
      window.confirm(
        "¿Seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer."
      )
    ) {
      alert("Cuenta eliminada.");
    }
  };

  return (
    <div className="config">
      <div className="config-bt">
        <BackButton />
      </div>

      <div className="config-page">
        <h1>Configuración</h1>

        {/* Tema */}
        <section className="config-section">
          <h2 className="config-h2">Tema</h2>
          <label className="switch">
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={handleThemeChange}
            />
            <span className="slider round"></span>
          </label>
          <span className="config-h2">
            {theme === "dark" ? "Modo Oscuro" : "Modo Claro"}
          </span>
        </section>

        {/* Datos de usuario */}
        <section className="config-section">
          <h2 className="config-h2">Datos de usuario</h2>
          <form onSubmit={handleUserSave} className="config-form">
            <label>
              Nombre:
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
              />
            </label>
            <label>
              Email:
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu correo"
              />
            </label>
            <button type="submit">Guardar</button>
          </form>
        </section>

        {/* Preferencias generales */}
        <section className="config-section">
          <h2 className="config-h2">Preferencias</h2>
          <form onSubmit={handlePreferencesSave} className="config-form">
            <label>
              Idioma:
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="es">Español</option>
                <option value="en">Inglés</option>
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
              Recibir notificaciones
            </label>
            <button type="submit">Guardar preferencias</button>
          </form>
        </section>

        {/* Acciones de cuenta */}
        <section className="config-section danger">
          <h2>Cuenta</h2>
          <button className="Config-logout-btn" onClick={handleLogout}>
            Cerrar sesión
          </button>
          <button className="Config-delete-btn" onClick={handleDeleteAccount}>
            Eliminar cuenta
          </button>
        </section>
      </div>
    </div>
  );
};

export default Config;
