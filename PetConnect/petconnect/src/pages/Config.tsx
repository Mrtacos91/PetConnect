import React, { useState } from "react";
import "../styles/Config.css";
import BackButton from "../components/BackButton";
import NotificationPopup from "../components/NotificationPopup";

const Config: React.FC = () => {
  // Estado para los formularios
  const [theme, setTheme] = useState<string>(
    localStorage.getItem("theme") || "light"
  );
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [language, setLanguage] = useState<string>("es");
  const [notifications, setNotifications] = useState<boolean>(true);
  const [notificationsList, setNotificationsList] = useState<Array<{
    id: string;
    type: "success" | "error" | "warning";
    message: string;
  }>>([]);

  const addNotification = (type: "success" | "error" | "warning", message: string) => {
    const id = Date.now().toString();
    setNotificationsList(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeNotification(id);
    }, 3000);
  };

  const removeNotification = (id: string) => {
    setNotificationsList(prev => prev.filter(notification => notification.id !== id));
  };

  // Handlers
  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedTheme = e.target.checked ? "dark" : "light";
    setTheme(selectedTheme);
    localStorage.setItem("theme", selectedTheme);
    document.body.classList.toggle("dark-mode", selectedTheme === "dark");
    addNotification("success", "Tema actualizado correctamente");
  };

  const handleUserSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar los datos del usuario
    addNotification("success", "Datos de usuario guardados correctamente");
  };

  const handlePreferencesSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar preferencias
    addNotification("success", "Preferencias guardadas correctamente");
  };

  const handleLogout = () => {
    // Aquí iría la lógica para cerrar sesión
    addNotification("warning", "Cerrando sesión...");
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        "¿Seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer."
      )
    ) {
      addNotification("error", "Cuenta eliminada permanentemente");
    }
  };

  const handleNotificationToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications(e.target.checked);
    addNotification(
      e.target.checked ? "success" : "warning",
      e.target.checked ? "Notificaciones activadas" : "Notificaciones desactivadas"
    );
  };

  return (
    <div className="config">
      <NotificationPopup
        notifications={notificationsList}
        onClose={removeNotification}
      />
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
            <div className="checkbox-wrapper-12">
              <div className="cbx">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={notifications}
                  onChange={handleNotificationToggle}
                />
                <label htmlFor="notifications"></label>
                <svg width="15" height="14" viewBox="0 0 15 14" fill="none">
                  <path d="M2 8.36364L6.23077 12L13 2" />
                </svg>
              </div>
              <span>Activar notificaciones</span>
            </div>
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
