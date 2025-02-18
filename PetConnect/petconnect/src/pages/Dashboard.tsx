import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import MenuButton from "../components/MenuButton";
import BottomNav from "../components/BottomNav";
import "../styles/dashboard.css";

const Dashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard">
      {/* Botón del menú SIEMPRE visible */}
      <MenuButton isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Sidebar con animación */}
      <Sidebar isOpen={isSidebarOpen} />

      <main className="content">
        <section className="left-panel"></section>
      </main>

      {/* Menú inferior */}
      <BottomNav />
    </div>
  );
};

export default Dashboard;
