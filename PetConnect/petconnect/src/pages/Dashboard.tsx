import React, { useState, useEffect } from "react";
import supabase from "../supabase";
import Sidebar from "../components/Sidebar";
import MenuButton from "../components/MenuButton";
import BottomNav from "../components/BottomNav";
import MyPetCard from "../components/MyPetCard";
import Actividades from "../components/Actividades";
import LocationCard from "../components/LocationCard";
import FoundDoctorCard from "../components/FoundDoctorCard";
import FoundHotelCard from "../components/FoundHotelCard";
import WelcomeCard from "../components/WelcomeCard";
import ActivitiesCard from "../components/ActivitiesCard";
import Location from "../components/Location";
import "../styles/dashboard.css";
import "../styles/Actividades.css";

const Dashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("inicio");
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: userSession, error: sessionError } =
        await supabase.auth.getUser();
      if (sessionError || !userSession?.user) return;

      const userEmail = userSession.user.email;
      const { data: user, error: userError } = await supabase
        .from("Users")
        .select("full_name")
        .eq("email", userEmail)
        .single();

      if (!userError) setUsername(user?.full_name);
    };

    fetchUserData();
  }, []);

  function toggleSidebar() {
    setIsSidebarOpen(!isSidebarOpen);
  }

  return (
    <div className="dashboard">
      <MenuButton isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} />

      <main className="content">
        {/* Pestaña Inicio */}
        {activeTab === "inicio" && (
          <>
            <div className="welcome-section">
              <WelcomeCard username={username || ""} />
            </div>
            <section className="left-panel">
              <MyPetCard
                imageUrl="/images/perro1.jpg"
                name="Fido"
                type="Perro"
                breed="Labrador Retriever"
              />
            </section>
            <section className="right-panel">
              <ActivitiesCard
                imageUrl="/images/perro1.jpg"
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
                lastLocation="Última actualización hace 5 minutos"
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
          </>
        )}

        {/* Pestaña Actividades */}
        {activeTab === "actividad" && (
          <section className="right-panel">
            <Actividades />
          </section>
        )}

        {/* Pestaña Asistente */}
        {activeTab === "asistente" && (
          <section className="right-panel">
            <h2>Asistente Virtual</h2>
            <p>Página en mantenimiento..</p>
          </section>
        )}

        {/* Pestaña Localizar */}
        {activeTab === "localizar" && (
          <section className="right-panel">
            <h2>Localización de Mascota</h2>
            <Location latitude={19.4326} longitude={-99.1332} name="Fido" />
          </section>
        )}
      </main>

      <BottomNav setActiveTab={setActiveTab} />
    </div>
  );
};

export default Dashboard;
