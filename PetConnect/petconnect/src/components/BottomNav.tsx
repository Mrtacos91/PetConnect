import React, {useRef, useEffect } from "react";
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
    updateIndicatorPosition(getIndexFromTab(currentTab));
  }, [currentTab]);

  // También actualizar cuando cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      updateIndicatorPosition(getIndexFromTab(currentTab));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentTab]);

  const updateIndicatorPosition = (index: number) => {
    const activeItem = itemRefs.current[index];
    const indicator = indicatorRef.current;

    if (activeItem && indicator) {
      const itemRect = activeItem.getBoundingClientRect();
      const navRect = activeItem.parentElement?.getBoundingClientRect();

      if (navRect) {
        const leftPosition =
          itemRect.left -
          navRect.left +
          itemRect.width / 2 -
          indicator.offsetWidth / 2;

        indicator.style.left = `${leftPosition}px`;
      }
    }
  };

  const handleItemClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <nav className="bottom-nav">
      <ul>
        <div ref={indicatorRef} className="indicator" />

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
