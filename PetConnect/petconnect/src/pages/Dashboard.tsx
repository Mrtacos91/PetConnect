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
import AssistantCard from "../components/AssistantCard";
import Location from "../components/Location";
import "../styles/dashboard.css";
import "../styles/Actividades.css";
import "../styles/TrackingMedico.css";
import TrackingMedico from "../components/TrackingMedico";
import ThemeToggle from "../components/ThemeToggle";

const Dashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("inicio");
  const [username, setUsername] = useState<string | null>(null);
  const [petData, setPetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      // Obtén la sesión del usuario autenticado en Supabase Auth
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getUser();
      if (sessionError || !sessionData?.user) {
        console.error(
          "Error obteniendo el usuario de Supabase Auth:",
          sessionError
        );
        setLoading(false);
        return;
      }
      const userEmail = sessionData.user.email;

      // Obtén el usuario local (tabla Users) con id y full_name usando el email
      const { data: localUser, error: userError } = await supabase
        .from("Users")
        .select("id, full_name")
        .eq("email", userEmail)
        .single();

      if (!userError && localUser) {
        setUsername(localUser.full_name);
      } else {
        console.error("Error obteniendo el usuario local:", userError);
      }

      const { data: pets, error: petsError } = await supabase
        .from("Pets")
        .select("*")
        .eq("user_id", localUser?.id)
        .limit(1);

      if (petsError) {
        console.error("Error obteniendo la mascota:", petsError);
      } else if (pets && pets.length > 0) {
        setPetData(pets[0]);
      }

      setLoading(false);
    };

    fetchUserData();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard">
      <MenuButton isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Integración del toggle de modo claro/oscuro */}
      <ThemeToggle />

      <Sidebar isOpen={isSidebarOpen} />

      <main className="content">
        {/* Pestaña Inicio */}
        {activeTab === "inicio" && (
          <>
            <div className="welcome-section">
              <WelcomeCard username={username || "Usuario"} />
            </div>
            <section className="left-panel">
              {loading ? (
                <p>Cargando datos de la mascota...</p>
              ) : (
                <MyPetCard
                  imageUrl={petData?.image_pet || "../public/images/foto.jpg"}
                  name={petData?.pet_name || "Mascota"}
                  type={petData?.pet_type || "Perro"}
                  breed={petData?.pet_breed || "Pug"}
                />
              )}
            </section>
            <section className="right-panel">
              <ActivitiesCard
                imageUrl="/images/perro1.jpg"
                name={petData?.pet_name || "Fido"}
                type={petData?.pet_type || "Perro"}
                breed={petData?.pet_breed || "Labrador Retriever"}
                vetAppointment="Lunes, 26 de Febrero - 10:00 AM"
                walkSchedule="Martes, 27 de Febrero - 6:30 PM"
                setActiveTab={setActiveTab}
              />
            </section>
            <section className="right-panel">
              <LocationCard
                location="Calle 123, Colonia Ejemplo, CDMX"
                hour="10:00 AM"
                lastLocation="Última actualización hace 5 minutos"
                name={petData?.pet_name || "Fido"}
                viewMap={() => console.log("Ver en el mapa")}
                setActiveTab={setActiveTab}
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
            <TrackingMedico />
          </section>
        )}

        {/* Pestaña Asistente */}
        {activeTab === "asistente" && (
          <section className="right-panel">
            <h2>Asistente Virtual</h2>
            <AssistantCard url="https://www.stack-ai.com/chat/67beadc6abbff18e8093f3d5-2e8W5L3shpTdxFCG4W53S5" />
          </section>
        )}

        {/* Pestaña Localizar */}
        {activeTab === "localizar" && (
          <section className="right-panel">
            <h2>Localización de Mascota</h2>
            <Location
              latitude={19.5575302}
              longitude={-99.3174041}
              name={petData?.pet_name || "Fido"}
            />
          </section>
        )}
      </main>

      <BottomNav setActiveTab={setActiveTab} />
    </div>
  );
};

export default Dashboard;
