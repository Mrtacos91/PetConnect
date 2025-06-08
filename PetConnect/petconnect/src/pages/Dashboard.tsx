import React, { useState, useEffect, lazy, Suspense } from "react";
import supabase from "../supabase";
import Sidebar from "../components/Sidebar";
import MenuButton from "../components/MenuButton";
import BottomNav from "../components/BottomNav";
import Loader from "../components/Loader";
import "../styles/dashboard.css";
import "../styles/Actividades.css";
import "../styles/TrackingMedico.css";
import ThemeToggle from "../components/ThemeToggle";

// Componentes lazy
const MyPetCard = lazy(() => import("../components/MyPetCard"));
const Actividades = lazy(() => import("../components/Actividades"));
const LocationCard = lazy(() => import("../components/LocationCard"));
const FoundDoctorCard = lazy(() => import("../components/FoundDoctorCard"));
const FoundHotelCard = lazy(() => import("../components/FoundHotelCard"));
const WelcomeCard = lazy(() => import("../components/WelcomeCard"));
const ActivitiesCard = lazy(() => import("../components/ActivitiesCard"));
const AssistantCard = lazy(() => import("../components/AssistantCard"));
const Location = lazy(() => import("../components/Location"));
const TrackingMedico = lazy(() => import("../components/TrackingMedico"));
const CalendarCard = lazy(() => import("../components/CalendarCard"));
const LinkDevice = lazy(() => import("../components/LinkDevice"));
const CarnetCard = lazy(() => import("../components/CarnetCard"));
const RecordatoriosCard = lazy(() => import("../components/RecordatoriosCard"));
const MyNfcCard = lazy(() => import("../components/MyNfcCard"));

// Componente de carga para Suspense
const LoadingFallback = () => (
  <div className="loading-fallback">
    <Loader />
  </div>
);

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
    if (tab === activeTab) return;
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

  // Componentes renderizados condicionalmente basados en la pestaña activa
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "inicio":
        return (
          <>
            <div className="welcome-section">
              <Suspense fallback={<LoadingFallback />}>
                <WelcomeCard username={username || "Usuario"} />
              </Suspense>
            </div>
            <main className="content">
              <section className="left-panel">
                {loading ? (
                  <p>Cargando datos de la mascota...</p>
                ) : (
                  <Suspense fallback={<LoadingFallback />}>
                    <MyPetCard
                      imageUrl={
                        petData?.image_pet || "../public/images/foto.jpg"
                      }
                      name={petData?.pet_name || "Mascota"}
                      type={petData?.pet_type || "Perro"}
                      breed={petData?.pet_breed || "Pug"}
                    />
                  </Suspense>
                )}
              </section>
              <Suspense fallback={<LoadingFallback />}>
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
              </Suspense>
            </main>
          </>
        );
      case "actividad":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <section className="actividad-section">
              <Actividades />
              <TrackingMedico />
              <RecordatoriosCard />
              <CalendarCard />
              <CarnetCard />
              <MyNfcCard />
            </section>
          </Suspense>
        );
      case "asistente":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <section className="right-panel">
              <AssistantCard url="https://www.stack-ai.com/chat/67beadc6abbff18e8093f3d5-2e8W5L3shpTdxFCG4W53S5" />
            </section>
          </Suspense>
        );
      case "localizar":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <section className="Location">
              <Location
                latitude={19.564559}
                longitude={-99.255172}
                name={petData?.pet_name || "Fido"}
              />
            </section>
          </Suspense>
        );
      default:
        return null;
    }
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
        {renderActiveTabContent()}
        <BottomNav setActiveTab={handleTabChange} currentTab={activeTab} />
      </div>
    </>
  );
};

export default Dashboard;
