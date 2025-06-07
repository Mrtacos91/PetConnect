import React, { useRef, useEffect } from "react";
import "../styles/BottomNav.css";
import { FaHome, FaComments, FaHeart } from "react-icons/fa";
import { PiGps } from "react-icons/pi";

interface BottomNavProps {
  setActiveTab: (tab: string) => void;
  currentTab: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ setActiveTab, currentTab }) => {
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement>(null);

  const getIndexFromTab = (tab: string): number => {
    const tabMap: { [key: string]: number } = {
      inicio: 0,
      actividad: 1,
      asistente: 2,
      localizar: 3,
    };
    return tabMap[tab] || 0;
  };

  // Actualizar la posición del indicador cuando cambia el currentTab
  useEffect(() => {
    // Add a small delay to ensure the layout is fully rendered
    const timer = setTimeout(() => {
      updateIndicatorPosition(getIndexFromTab(currentTab));
    }, 50);
    return () => clearTimeout(timer);
  }, [currentTab]);

  // También actualizar cuando cambia el tamaño de la ventana o la orientación del dispositivo
  useEffect(() => {
    const handleResize = () => {
      // Agregamos un pequeño retraso para asegurar que los cálculos de tamaño sean correctos
      setTimeout(() => {
        updateIndicatorPosition(getIndexFromTab(currentTab));
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    // También actualizamos cuando la página termina de cargar completamente
    window.addEventListener("load", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      window.removeEventListener("load", handleResize);
    };
  }, [currentTab]);

  const updateIndicatorPosition = (index: number) => {
    const activeItem = itemRefs.current[index];
    const indicator = indicatorRef.current;

    if (activeItem && indicator) {
      // Get current active tab's position and dimensions
      const itemRect = activeItem.getBoundingClientRect();
      const navRect = activeItem.parentElement?.getBoundingClientRect();

      if (navRect) {
        // Precisely calculate center point of the active tab
        const itemCenter = itemRect.left + (itemRect.width / 2);
        
        // Calculate offset from the nav container's left edge
        const navLeft = navRect.left;
        
        // Get the indicator's actual width for perfect centering
        const indicatorWidth = indicator.offsetWidth;
        
        // Calculate precise transform value for exact centering
        // This positions the indicator's center directly below the tab's center
        const transformValue = itemCenter - navLeft - (indicatorWidth / 2);
        
        // Apply the transform with the exact value
        indicator.style.transform = `translateX(${transformValue}px)`;
      }
    }
  };

  const handleItemClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <nav className="BottomNav-container">
      <ul>
        <div ref={indicatorRef} className="BottomNav-indicator" />

        <li
          ref={(el) => (itemRefs.current[0] = el)}
          className={currentTab === "inicio" ? "list active" : "list"}
          onClick={() => handleItemClick("inicio")}
        >
          <FaHome />
          <span>Inicio</span>
        </li>
        <li
          ref={(el) => (itemRefs.current[1] = el)}
          className={currentTab === "actividad" ? "list active" : "list"}
          onClick={() => handleItemClick("actividad")}
        >
          <FaComments />
          <span>Actividad</span>
        </li>
        <li
          ref={(el) => (itemRefs.current[2] = el)}
          className={currentTab === "asistente" ? "list active" : "list"}
          onClick={() => handleItemClick("asistente")}
        >
          <FaHeart />
          <span>Asistente</span>
        </li>
        <li
          ref={(el) => (itemRefs.current[3] = el)}
          className={currentTab === "localizar" ? "list active" : "list"}
          onClick={() => handleItemClick("localizar")}
        >
          <PiGps />
          <span>Localizar</span>
        </li>
      </ul>
    </nav>
  );
};

export default BottomNav;
