import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import MenuButton from "../components/MenuButton";
import BottomNav from "../components/BottomNav";
import MyPetCard from "../components/MyPetCard";
import ActivitiesCard from "../components/ActivitiesCard";
import "../styles/dashboard.css";
import LocationCard from "../components/LocationCard";
import FoundDoctorCard from "../components/FoundDoctorCard";
import FoundHotelCard from "../components/FoundHotelCard";
import WelcomeCard from "../components/WelcomeCard";

const Dashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard">
      {/* Botón del menú siempre visible */}
      <MenuButton isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Sidebar con animación */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* 📌 Contenedor principal */}
      <main className="content">
        <div>
          <WelcomeCard username="Carlos" /> {/* O puedes dejarlo vacío */}
        </div>
        <section className="left-panel">
          <MyPetCard
            imageUrl="/images/perro1.jpg"
            name="Fido"
            type="Perro"
            breed="Labrador retriever"
          />
        </section>

        <section className="right-panel">
          <ActivitiesCard
            imageUrl="../public/images/perro1.jpg"
            name="Fido"
            type="Perro"
            breed="Labrador Retriever"
            vetAppointment="Lunes, 26 de Febrero - 10:00 AM"
            walkSchedule="Martes, 27 de Febrero - 6:30 PM"
          />
        </section>
        <section className="right-panel">
          <LocationCard
            location="Calle 123, Colonia Ejemplo, CDMX"
            hour="10:00 AM"
            lastLocation="Calle 123, Colonia Ejemplo, CDMX, última actualización hace 5 minutos"
            name="Fido"
            viewMap={() => console.log("Ver en el mapa")}
          />
        </section>
        <section className="right-panel">
          <FoundDoctorCard Info="Encuentra un veterinario cerca de ti aquí" />
        </section>
        <section className="right-panel">
          <FoundHotelCard Info="Encuentra un hotel para tu mascota aquí" />
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
