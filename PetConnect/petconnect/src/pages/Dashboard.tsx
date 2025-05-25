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
import Loader from "../components/Loader";
import "../styles/dashboard.css";
import "../styles/Actividades.css";
import "../styles/TrackingMedico.css";
import TrackingMedico from "../components/TrackingMedico";
import ThemeToggle from "../components/ThemeToggle";
import CalendarCard from "../components/CalendarCard";
import LinkDevice from "../components/LinkDevice";
import CarnetCard from "../components/CarnetCard";
import RecordatoriosCard from "../components/RecordatoriosCard";

const Dashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("inicio");
  const [username, setUsername] = useState<string | null>(null);
  const [petData, setPetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isChangingTab, setIsChangingTab] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getUser();
        if (sessionError || !sessionData?.user) {
          console.error(
            "Error obteniendo el usuario de Supabase Auth:",
            sessionError
          );
          return;
        }
        const userEmail = sessionData.user.email;

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
      } catch (error) {
        console.error("Error en fetchUserData:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return; // Evitar recargar si es la misma pestaña
    setIsChangingTab(true);
    setActiveTab(tab);
  };

  const handleLoadingComplete = () => {
    setLoading(false);
    setIsChangingTab(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {(loading || isChangingTab) && (
        <Loader onLoadingComplete={handleLoadingComplete} />
      )}
      <div className={`dashboard ${loading || isChangingTab ? "loading" : ""}`}>
        <MenuButton isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <ThemeToggle />
        <Sidebar isOpen={isSidebarOpen} />

        {activeTab === "inicio" && (
          <div className="welcome-section">
            <WelcomeCard username={username || "Usuario"} />
          </div>
        )}

        {activeTab === "actividad" && (
          <section className="actividad-section">
            <Actividades />
            <TrackingMedico />
            <RecordatoriosCard />
            <CalendarCard />
            <CarnetCard />
          </section>
        )}

        {activeTab === "asistente" && (
          <section className="right-panel">
            <AssistantCard url="https://www.stack-ai.com/chat/67beadc6abbff18e8093f3d5-2e8W5L3shpTdxFCG4W53S5" />
          </section>
        )}

        {activeTab === "localizar" && (
          <section className="Location">
            <Location
              latitude={19.564559}
              longitude={-99.255172}
              name={petData?.pet_name || "Fido"}
            />
          </section>
        )}

        <main className="content">
          {activeTab === "inicio" && (
            <>
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
                  setActiveTab={handleTabChange}
                />
              </section>
              <section className="right-panel">
                <LocationCard
                  name={petData?.pet_name || "Fido"}
                  viewMap={() => handleTabChange("localizar")}
                  setActiveTab={handleTabChange}
                />
              </section>
              <section className="right-panel">
                <LinkDevice />
              </section>
              <section className="right-panel">
                <FoundDoctorCard Info="Encuentra un veterinario cerca de ti aquí" />
              </section>
              <section className="right-panel">
                <FoundHotelCard Info="Encuentra un hotel para tu mascota aquí" />
              </section>
            </>
          )}
        </main>

        <BottomNav setActiveTab={handleTabChange} currentTab={activeTab} />
      </div>
    </>
  );
};

export default Dashboard;
