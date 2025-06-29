import React, { useState, useEffect } from "react";
import "../styles/ActivitiesCard.css";
import supabase from "../supabase";

import { FaStethoscope, FaWalking, FaCalendarAlt } from "react-icons/fa";

// Mapeo de letras de día a número de día (0=Domingo, 6=Sábado)
const dayLetterToNumber: Record<string, number> = {
  L: 1,
  M: 2,
  m: 3,
  J: 4,
  V: 5,
  S: 6,
  D: 0,
};

interface ActivitiesCardProps {
  imageUrl: string;
  name: string;
  type: string;
  breed: string;
  vetAppointment?: string;
  walkSchedule?: string;
  setActiveTab: (tab: string) => void; // 🔹 Nueva prop para cambiar el tab
}

const ActivitiesCard: React.FC<ActivitiesCardProps> = ({
  setActiveTab, // 🔹 Recibimos setActiveTab
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [nextVet, setNextVet] = useState<string | null>(null);
  const [nextWalk, setNextWalk] = useState<string | null>(null);
  const [nextCalendar, setNextCalendar] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1️⃣ Obtener usuario autenticado
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getUser();
        if (sessionError || !sessionData?.user) {
          setIsLoading(false);
          return;
        }

        // 2️⃣ Obtener ID local del usuario
        const { data: localUser, error: localUserError } = await supabase
          .from("Users")
          .select("id")
          .eq("email", sessionData.user.email)
          .single();

        if (localUserError || !localUser) {
          setIsLoading(false);
          return;
        }

        const userId = localUser.id;

        const todayISO = new Date().toISOString().split("T")[0];

        // 3️⃣ Próxima cita veterinaria (tabla events)
        const { data: eventsData } = await supabase
          .from("events")
          .select("*")
          .eq("user_id", userId)
          .gte("Date", todayISO)
          .order("Date", { ascending: true })
          .order("Time", { ascending: true });

        if (eventsData && eventsData.length > 0) {
          const e = eventsData[0];
          const fecha = new Date(e.Date).toLocaleDateString("es-ES", {
            weekday: "short",
            day: "numeric",
            month: "short",
          });
          setNextVet(`${e.Name} - ${fecha} ${e.Time}`);
        }

        // 4️⃣ Próximo evento de calendario (tabla calendar)
        const { data: calData } = await supabase
          .from("calendar")
          .select("*")
          .eq("user_id", userId)
          .gte("date", todayISO)
          .order("date", { ascending: true });

        if (calData && calData.length > 0) {
          const c = calData[0];
          const fecha = new Date(c.date).toLocaleDateString("es-ES", {
            weekday: "short",
            day: "numeric",
            month: "short",
          });
          setNextCalendar(`${c.title} - ${fecha}`);
        }

        // 5️⃣ Próximo paseo (tabla walks)
        const { data: walksData } = await supabase
          .from("walks")
          .select("*")
          .eq("user_id", userId)
          .eq("active", true);

        if (walksData && walksData.length > 0) {
          const now = new Date();
          let earliestDate: Date | null = null;

          walksData.forEach((walk: any) => {
            const days: string[] = walk.days || [];
            const [hourStr, minuteStr] = (walk.hour || "00:00").split(":");
            const h = parseInt(hourStr, 10);
            const m = parseInt(minuteStr, 10);

            days.forEach((d) => {
              const dayNum = dayLetterToNumber[d];
              if (dayNum === undefined) return;

              const next = new Date(now);
              let diff = (dayNum - now.getDay() + 7) % 7;
              if (diff === 0) {
                // Hoy: verificar si la hora ya pasó
                const hoyWalk = new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  now.getDate(),
                  h,
                  m,
                  0,
                  0
                );
                if (hoyWalk <= now) diff = 7;
              }
              next.setDate(now.getDate() + diff);
              next.setHours(h, m, 0, 0);

              if (!earliestDate || next < earliestDate) {
                earliestDate = next;
              }
            });
          });

          if (earliestDate) {
            const dateObj = earliestDate as Date;
            const fecha = dateObj.toLocaleDateString("es-ES", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
            const hora = dateObj.toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            });
            setNextWalk(`${fecha} ${hora}`);
          }
        }
      } catch (error) {
        console.error("Error cargando resumen de actividades:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCardClick = () => {
    setActiveTab("actividad"); // 🔹 Cambiamos a la pestaña de actividades
  };

  return (
    <div className="highlight-container-activities" onClick={handleCardClick}>
      <h2 className="highlight-title-activities">Próximas actividades</h2>

      {isLoading ? (
        <div className="skeleton-container-activities">
          <div className="skeleton skeleton-title-activities"></div>
          <div className="skeleton skeleton-subtext-activities"></div>
          <div className="skeleton skeleton-subtext-activities"></div>
          <div className="skeleton skeleton-activity"></div>
          <div className="skeleton skeleton-activity"></div>
        </div>
      ) : (
        <div className="highlight-card-activities">
          <aside className="pet-info-activities">
            <div className="activities-section">
              {nextVet && (
                <div className="activity">
                  <FaStethoscope className="icon-activities" />
                  <p>
                    <strong>Cita Vet:</strong> {nextVet}
                  </p>
                </div>
              )}

              {nextWalk && (
                <div className="activity">
                  <FaWalking className="icon-activities" />
                  <p>
                    <strong>Próximo Paseo:</strong> {nextWalk}
                  </p>
                </div>
              )}

              {nextCalendar && (
                <div className="activity">
                  <FaCalendarAlt className="icon-activities" />
                  <p>
                    <strong>Evento:</strong> {nextCalendar}
                  </p>
                </div>
              )}

              {!nextVet && !nextWalk && !nextCalendar && (
                <p>No tienes actividades próximas.</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default ActivitiesCard;
