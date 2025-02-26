import React, { useEffect, useState } from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import "../styles/DarkMode.css";

const DarkMode: React.FC = () => {
  // Inicializa darkMode leyendo de localStorage, o usa false si no hay valor guardado.
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  // Función para alternar el tema
  const toggleTheme = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("darkMode", JSON.stringify(newMode));
      return newMode;
    });
  };

  // Aplica o remueve la clase "dark-mode" en el body cada vez que darkMode cambia
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  return (
    <button className="dark-mode-toggle" onClick={toggleTheme}>
      {darkMode ? (
        <>
          <FaSun className="icon-light" /> Modo Claro
        </>
      ) : (
        <>
          <FaMoon className="icon-dark" /> Modo Oscuro
        </>
      )}
    </button>
  );
};

export default DarkMode;
