import React, { useState, useRef, useEffect } from "react";
import "../styles/BottomNav.css";
import { FaHome, FaComments, FaHeart } from "react-icons/fa";
import { PiGps } from "react-icons/pi";

interface BottomNavProps {
  setActiveTab: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ setActiveTab }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement>(null);

  // Actualizar la posición del indicador cuando cambia el activeIndex
  useEffect(() => {
    updateIndicatorPosition(activeIndex);
  }, [activeIndex]);

  // También actualizar cuando cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      updateIndicatorPosition(activeIndex);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIndex]);

  const updateIndicatorPosition = (index: number) => {
    const activeItem = itemRefs.current[index];
    const indicator = indicatorRef.current;

    if (activeItem && indicator) {
      const itemRect = activeItem.getBoundingClientRect();
      const navRect = activeItem.parentElement?.getBoundingClientRect();

      if (navRect) {
        // Calcular la posición relativa al contenedor padre
        const leftPosition =
          itemRect.left -
          navRect.left +
          itemRect.width / 2 -
          indicator.offsetWidth / 2;

        // Aplicar la posición calculada
        indicator.style.left = `${leftPosition}px`;
      }
    }
  };

  const handleItemClick = (index: number, tab: string) => {
    setActiveIndex(index);
    setActiveTab(tab);
  };

  return (
    <nav className="bottom-nav">
      <ul>
        {/* Indicador animado */}
        <div ref={indicatorRef} className="indicator" />

        <li
          ref={(el) => (itemRefs.current[0] = el)}
          className={activeIndex === 0 ? "list active" : "list"}
          onClick={() => handleItemClick(0, "inicio")}
        >
          <FaHome />
          <span>Inicio</span>
        </li>
        <li
          ref={(el) => (itemRefs.current[1] = el)}
          className={activeIndex === 1 ? "list active" : "list"}
          onClick={() => handleItemClick(1, "actividad")}
        >
          <FaComments />
          <span>Actividad</span>
        </li>
        <li
          ref={(el) => (itemRefs.current[2] = el)}
          className={activeIndex === 2 ? "list active" : "list"}
          onClick={() => handleItemClick(2, "asistente")}
        >
          <FaHeart />
          <span>Asistente</span>
        </li>
        <li
          ref={(el) => (itemRefs.current[3] = el)}
          className={activeIndex === 3 ? "list active" : "list"}
          onClick={() => handleItemClick(3, "localizar")}
        >
          <PiGps />
          <span>Localizar</span>
        </li>
      </ul>
    </nav>
  );
};

export default BottomNav;
