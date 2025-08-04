import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaPaw,
  FaShoppingCart,
  FaDownload,
  FaTimes,
} from "react-icons/fa";
import supabase from "../supabase";
import "../styles/Sidebar.css";
import SocialMedia from "../components/SocialMedia";

// Declaración de tipo para BeforeInstallPromptEvent
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const [isPWAInstallable, setIsPWAInstallable] = useState(false);

  useEffect(() => {
    // Verificar el tema inicial
    const checkTheme = () => {
      const theme = localStorage.getItem("theme");
      setIsDarkMode(theme === "dark");
    };

    // Verificar el tema cuando el componente se monta
    checkTheme();

    // Configurar un observador para detectar cambios en el tema
    const observer = new MutationObserver(() => {
      checkTheme();
    });

    // Observar cambios en las clases del body
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Verificar si la PWA es instalable
    const checkPWAInstallable = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInstalled = (window.navigator as any).standalone || isStandalone;
      setIsPWAInstallable(!isInstalled && 'serviceWorker' in navigator);
    };

    checkPWAInstallable();

    // Limpiar el observador cuando el componente se desmonta
    return () => observer.disconnect();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };


  const handleCloseInstructions = () => {
    setShowInstallInstructions(false);
  };

  const handleInstallPWA = async () => {
    try {
      // Detectar el navegador y plataforma
      const userAgent = navigator.userAgent;
      const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
      const isEdge = /Edge/.test(userAgent);
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

      // Para iOS Safari, mostrar instrucciones específicas
      if (isIOS && isSafari) {
        setShowInstallInstructions(true);
        return;
      }

      // Para Chrome/Edge en móvil o escritorio
      if ((isChrome || isEdge) && 'serviceWorker' in navigator) {
        // Intentar usar el prompt nativo si está disponible
        if ('BeforeInstallPromptEvent' in window) {
          try {
            // Buscar un prompt existente o esperar uno nuevo
            const installPrompt = await new Promise<BeforeInstallPromptEvent>((resolve) => {
              const handler = (e: Event) => {
                window.removeEventListener('beforeinstallprompt', handler);
                resolve(e as BeforeInstallPromptEvent);
              };
              window.addEventListener('beforeinstallprompt', handler);
              
              // Timeout después de 500ms
              setTimeout(() => {
                window.removeEventListener('beforeinstallprompt', handler);
                resolve(null as any);
              }, 500);
            });

            if (installPrompt) {
              installPrompt.prompt();
              const result = await installPrompt.userChoice;
              if (result.outcome === 'accepted') {
                console.log('PWA instalada exitosamente');
                setShowInstallInstructions(false);
                setIsPWAInstallable(false);
                return;
              }
            }
          } catch (promptError) {
            console.log('Prompt nativo no disponible:', promptError);
          }
        }

        // Si no hay prompt nativo, intentar otras opciones
        if (isMobile) {
          // En móvil, mostrar instrucciones específicas
          setShowInstallInstructions(true);
        } else {
          // En escritorio, intentar abrir el menú de instalación
          try {
            // Simular clic en el menú de Chrome
            const menuButton = document.querySelector('[aria-label="Más herramientas"]') as HTMLElement;
            if (menuButton) {
              menuButton.click();
              // Esperar un poco y buscar la opción de instalación
              setTimeout(() => {
                const installOption = document.querySelector('[aria-label="Crear acceso directo"]') as HTMLElement;
                if (installOption) {
                  installOption.click();
                }
              }, 100);
            } else {
              setShowInstallInstructions(true);
            }
          } catch (menuError) {
            console.log('No se pudo acceder al menú:', menuError);
            setShowInstallInstructions(true);
          }
        }
      } else {
        // Navegador no soportado, mostrar instrucciones
        setShowInstallInstructions(true);
      }
    } catch (error) {
      console.error('Error al intentar instalar PWA:', error);
      setShowInstallInstructions(true);
    }
  };

  return (
    <>
      <div className={`sidebar-container ${isOpen ? "sidebar-open" : ""}`}>
        <nav className="sidebar-nav">
          <div className="sidebar-logo">
            <img
              src={
                isDarkMode
                  ? "/images/Logo_gradient.png"
                  : "/images/Logo_black.png"
              }
              alt="PetConnect Logo"
              className="sidebar-logo-img"
            />
          </div>
          <ul className="sidebar-menu">
            <li
              className="sidebar-menu-item"
              onClick={() => navigate("/Micuenta")}
            >
              <div className="sidebar-menu-link">
                <FaUser className="sidebar-icon" />
                <span className="sidebar-link-text">Mi cuenta</span>
              </div>
            </li>
            <li
              className="sidebar-menu-item"
              onClick={() => navigate("/customise")}
            >
              <div className="sidebar-menu-link">
                <FaPaw className="sidebar-icon" />
                <span className="sidebar-link-text">Mis mascotas</span>
              </div>
            </li>
            <li className="sidebar-menu-item" onClick={() => navigate("/shop")}>
              <div className="sidebar-menu-link">
                <FaShoppingCart className="sidebar-icon" />
                <span className="sidebar-link-text">Tienda</span>
              </div>
            </li>
            <li className="sidebar-menu-item" onClick={() => navigate("/config")}>
              <div className="sidebar-menu-link">
                <FaCog className="sidebar-icon" />
                <span className="sidebar-link-text">Configuración</span>
              </div>
            </li>

            {isPWAInstallable && (
              <li className="sidebar-menu-item sidebar-install" onClick={handleInstallPWA}>
                <div className="sidebar-menu-link">
                  <FaDownload className="sidebar-icon" />
                  <span className="sidebar-link-text">Instalar App</span>
                </div>
              </li>
            )}

            <li
              className="sidebar-menu-item sidebar-logout"
              onClick={handleLogout}
            >
              <div className="sidebar-menu-link">
                <FaSignOutAlt className="sidebar-icon" />
                <span className="sidebar-link-text">Cerrar sesión</span>
              </div>
            </li>
          </ul>
          <div className="sidebar-social">
            <SocialMedia />
          </div>
        </nav>
      </div>

      {/* Modal de instrucciones de instalación */}
      {showInstallInstructions && (
        <div className="install-instructions-overlay" onClick={handleCloseInstructions}>
          <div className="install-instructions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="install-instructions-header">
              <h3>📱 Instalar PetConnect como App</h3>
              <button className="install-close-btn" onClick={handleCloseInstructions}>
                <FaTimes />
              </button>
            </div>
            
            <div className="install-instructions-actions">
              <button className="install-pwa-btn" onClick={handleInstallPWA}>
                <FaDownload />
                Instalar Ahora
              </button>
              <p className="install-or-text">o sigue las instrucciones manuales:</p>
            </div>
            
            <div className="install-instructions-content">
              <div className="install-step">
                <h4>🖥️ En Chrome/Edge (Escritorio):</h4>
                <ol>
                  <li>Haz clic en el ícono de <strong>instalación</strong> en la barra de direcciones</li>
                  <li>O ve a <strong>Menú → Más herramientas → Crear acceso directo</strong></li>
                  <li>Selecciona "Instalar" y confirma</li>
                </ol>
              </div>

              <div className="install-step">
                <h4>📱 En Android (Chrome):</h4>
                <ol>
                  <li>Toca el <strong>menú de tres puntos</strong> en la esquina superior derecha</li>
                  <li>Selecciona <strong>"Instalar aplicación"</strong></li>
                  <li>Confirma la instalación</li>
                </ol>
              </div>

              <div className="install-step">
                <h4>🍎 En iPhone/iPad (Safari):</h4>
                <ol>
                  <li>Toca el <strong>botón de compartir</strong> (cuadrado con flecha)</li>
                  <li>Selecciona <strong>"Añadir a pantalla de inicio"</strong></li>
                  <li>Confirma y la app aparecerá en tu pantalla de inicio</li>
                </ol>
              </div>

              <div className="install-benefits">
                <h4>✨ Beneficios de instalar la app:</h4>
                <ul>
                  <li>✅ Acceso rápido desde el escritorio/pantalla de inicio</li>
                  <li>✅ Notificaciones push completas</li>
                  <li>✅ Funciona sin conexión</li>
                  <li>✅ Experiencia como app nativa</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
