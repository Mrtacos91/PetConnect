import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../styles/Config.css";
import BackButton from "../components/BackButton";
import NotificationPopup from "../components/NotificationPopup";
import {
  FiSun,
  FiMoon,
  FiBell,
  FiEye,
  FiGlobe,
  FiShield,
  FiChevronDown,
} from "react-icons/fi";
import i18n from "../i18n/i18n";
// Color blindness filters are now handled via CSS

// Translations are loaded via i18n configuration

// Types
type ColorBlindnessType = "none" | "protanopia" | "deuteranopia" | "tritanopia";

type SettingItem = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
};

const Config = () => {
  const [theme, setTheme] = useState<string>(
    localStorage.getItem("theme") || "light"
  );
  const [language, setLanguage] = useState("es");
  const [notifications, setNotifications] = useState(true);
  const [colorBlindness, setColorBlindness] =
    useState<ColorBlindnessType>("none");
  const [fontSize, setFontSize] = useState<number>(16);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [notificationsList, setNotificationsList] = useState<
    Array<{
      id: string;
      message: string;
      type: "success" | "error";
    }>
  >([]);

  // Apply color blindness effect when type changes
  useEffect(() => {
    const root = document.documentElement;

    // Remove all color blindness classes first
    root.classList.remove(
      "color-blindness-protanopia",
      "color-blindness-deuteranopia",
      "color-blindness-tritanopia"
    );

    // Add the appropriate class if not 'none'
    if (colorBlindness !== "none") {
      root.classList.add(`color-blindness-${colorBlindness}`);
    }

    // Set CSS variable for filter
    root.style.setProperty(
      "--active-color-filter",
      colorBlindness === "none" ? "none" : `var(--filter-${colorBlindness})`
    );
  }, [colorBlindness]);

  // Apply font size
  useEffect(() => {
    document.documentElement.style.setProperty("--font-size", `${fontSize}px`);
  }, [fontSize]);

  const addNotification = (type: "success" | "error", message: string) => {
    const id = Date.now().toString();
    setNotificationsList((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeNotification(id);
    }, 3000);
  };

  const removeNotification = (id: string) => {
    setNotificationsList((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  // Handlers
  const handleThemeChange = (isDark: boolean) => {
    const selectedTheme = isDark ? "dark" : "light";
    setTheme(selectedTheme);
    localStorage.setItem("theme", selectedTheme);
    document.body.classList.toggle("dark-mode", selectedTheme === "dark");
    addNotification("success", `Modo ${isDark ? "oscuro" : "claro"} activado`);
  };

  const { t } = useTranslation();

  // Handle language change
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n
      .changeLanguage(lang)
      .then(() => {
        addNotification(
          "success",
          `${t("settings.languageChanged")}: ${t(`languages.${lang}`)}`
        );
        // Update document direction for RTL/LTR support if needed
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      })
      .catch((error) => {
        console.error("Error changing language:", error);
        addNotification("error", t("settings.languageChangeError"));
      });
  };

  const handleNotificationToggle = (enabled: boolean) => {
    setNotifications(enabled);
    addNotification(
      enabled ? "success" : "error",
      enabled ? "Notificaciones activadas" : "Notificaciones desactivadas"
    );
  };

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(Math.max(12, Math.min(24, newSize)));
  };

  // Settings items configuration
  const openPermissionsModal = () => setShowPermissionsModal(true);
  const closePermissionsModal = () => setShowPermissionsModal(false);

  // Handle color blindness change
  const handleColorBlindnessChange = (type: ColorBlindnessType) => {
    setColorBlindness(type);
    const typeNames = {
      none: "normal",
      protanopia: "protanopia",
      deuteranopia: "deuteranomalía",
      tritanopia: "tritanomalía",
    };
    addNotification("success", `Modo de visión: ${typeNames[type]}`);
  };

  const settingsItems: SettingItem[] = [
    {
      id: "theme",
      title: "Tema",
      description: `Cambiar a modo ${theme === "dark" ? "claro" : "oscuro"}`,
      icon: theme === "dark" ? <FiMoon size={20} /> : <FiSun size={20} />,
      component: (
        <div className="theme-options">
          <button
            className={`theme-option ${theme === "light" ? "active" : ""}`}
            onClick={() => handleThemeChange(false)}
            aria-label="Tema claro"
          >
            <FiSun />
            <span>Claro</span>
          </button>
          <button
            className={`theme-option ${theme === "dark" ? "active" : ""}`}
            onClick={() => handleThemeChange(true)}
            aria-label="Tema oscuro"
          >
            <FiMoon />
            <span>Oscuro</span>
          </button>
        </div>
      ),
    },
    {
      id: "language",
      title: t("settings.language"),
      description: `${t("settings.currentLanguage")}: ${t(
        `languages.${language}`
      )}`,
      icon: <FiGlobe size={20} />,
      component: (
        <div className="language-selector">
          <div className="custom-select">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="language-dropdown"
              aria-label={t("settings.selectLanguage")}
            >
              <option value="es">{t("languages.es")}</option>
              <option value="en">{t("languages.en")}</option>
            </select>
            <FiChevronDown className="select-arrow" />
          </div>
        </div>
      ),
    },
    {
      id: "notifications",
      title: "Notificaciones",
      description: notifications
        ? "Notificaciones activadas"
        : "Notificaciones desactivadas",
      icon: <FiBell size={20} />,
      component: (
        <div className="toggle-switch">
          <span>{notifications ? "Activadas" : "Desactivadas"}</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => handleNotificationToggle(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
      ),
    },
    {
      id: "vision",
      title: "Accesibilidad visual",
      description: "Ajustes para mejorar la visibilidad",
      icon: <FiEye size={20} />,
      component: (
        <div className="vision-options">
          <div className="font-size-control">
            <label>Tamaño de fuente: {fontSize}px</label>
            <input
              type="range"
              min="12"
              max="24"
              value={fontSize}
              onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
            />
          </div>
          <div className="color-blindness">
            <label>Modo daltónico:</label>
            <div className="color-blindness-options">
              {[
                { id: "none", label: "Ninguno" },
                { id: "protanopia", label: "Protanopia" },
                { id: "deuteranopia", label: "Deuteranopia" },
                { id: "tritanopia", label: "Tritanopia" },
              ].map(({ id, label }) => {
                const isActive = colorBlindness === id;
                return (
                  <button
                    className={`color-option ${
                      colorBlindness === id ? "active" : ""
                    }`}
                    data-type={id}
                    onClick={() =>
                      handleColorBlindnessChange(id as ColorBlindnessType)
                    }
                    aria-label={`Modo ${label}`}
                    aria-pressed={isActive}
                  >
                    {label}
                    {isActive && (
                      <span className="sr-only">(seleccionado)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "permissions",
      title: "Permisos de la aplicación",
      description: "Gestiona los permisos de la aplicación en tu dispositivo",
      icon: <FiShield size={20} />,
      component: (
        <div className="permissions-info">
          <p>
            Configura los permisos de la aplicación en la configuración de tu
            dispositivo.
          </p>
          <button
            className="permissions-button"
            onClick={openPermissionsModal}
            aria-label="Ver instrucciones de permisos"
          >
            Ver instrucciones
          </button>
        </div>
      ),
    },
  ];

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
        <p className="config-subtitle">
          Personaliza tu experiencia en PetConnect
        </p>

        <div className="settings-container">
          {settingsItems.map((item) => (
            <div key={item.id} className="setting-card">
              <div className="setting-header">
                <div className="setting-icon">{item.icon}</div>
                <div className="setting-info">
                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                </div>
              </div>
              <div className="setting-content">{item.component}</div>
            </div>
          ))}
        </div>

        {/* Color blindness filter SVG definitions */}
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <filter id="protanopia">
              <feColorMatrix
                type="matrix"
                values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0"
              />
            </filter>
            <filter id="deuteranopia">
              <feColorMatrix
                type="matrix"
                values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0"
              />
            </filter>
            <filter id="tritanopia">
              <feColorMatrix
                type="matrix"
                values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0"
              />
            </filter>
          </defs>
        </svg>
      </div>

      {/* Permissions Modal */}
      {showPermissionsModal && (
        <div className="modal-overlay" onClick={closePermissionsModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Gestión de permisos</h2>
              <button
                className="close-button"
                onClick={closePermissionsModal}
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="device-instructions">
                <h3>En dispositivos móviles (Android/iOS):</h3>
                <ol>
                  <li>
                    Abre la aplicación de <strong>Ajustes</strong> de tu
                    dispositivo
                  </li>
                  <li>
                    Desplázate hacia abajo y selecciona{" "}
                    <strong>Aplicaciones</strong> o{" "}
                    <strong>Administración de aplicaciones</strong>
                  </li>
                  <li>
                    Busca y selecciona <strong>PetConnect</strong>
                  </li>
                  <li>
                    Selecciona <strong>Permisos</strong>
                  </li>
                  <li>Activa o desactiva los permisos según prefieras</li>
                </ol>

                <h3>En navegadores de escritorio (Chrome/Edge/Firefox):</h3>
                <ol>
                  <li>
                    Haz clic en el ícono de candado en la barra de direcciones
                  </li>
                  <li>
                    Selecciona <strong>Configuración del sitio</strong> o{" "}
                    <strong>Configuración de la página</strong>
                  </li>
                  <li>
                    Busca la sección de <strong>Permisos</strong>
                  </li>
                  <li>
                    Ajusta los permisos según necesites (Ubicación, Cámara,
                    Notificaciones, etc.)
                  </li>
                  <li>Recarga la página para que los cambios surtan efecto</li>
                </ol>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="close-modal-button"
                onClick={closePermissionsModal}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Config;
