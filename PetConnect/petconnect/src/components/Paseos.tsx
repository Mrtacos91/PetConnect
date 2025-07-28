import React, { useState, useEffect, useCallback } from "react";
import { TimePicker } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { FaPlus, FaTimes } from "react-icons/fa";
import "../styles/Paseos.css";
import supabase from "../supabase";
import { useNavigate } from "react-router-dom";
import AlertMessage from "./AlertMessage";
import { messaging, onMessage, getOrCreateFCMToken } from "../../firebase";

// Setup dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
const TIMEZONE = "America/Mexico_City"; // Standardize timezone

// Interface for the alarm
interface PaseoAlarm {
  id: string;
  name: string;
  days: string[];
  time: dayjs.Dayjs | null;
  active?: boolean;
  user_id?: number;
}

const Paseos: React.FC = () => {
  const navigate = useNavigate();
  const [alarms, setAlarms] = useState<PaseoAlarm[]>([]);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "error" | "warning";
      message: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // --- Handlers for UI feedback ---
  const showNotification = useCallback(
    (type: "success" | "error" | "warning", message: string) => {
      const id =
        Date.now().toString() + Math.random().toString(36).substring(2, 7);
      setNotifications((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 4000);
    },
    []
  );

  const closeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // --- Initialization and Data Fetching ---
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    const init = async () => {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: localUser, error: userError } = await supabase
        .from("Users")
        .select("id, fcm_token")
        .eq("email", user.email)
        .single();

      if (userError || !localUser) {
        showNotification("error", "No se pudo cargar el perfil de usuario.");
        navigate("/login");
        return;
      }

      setUserId(localUser.id);
      await fetchAlarms(localUser.id);
      await initFCM(localUser);

      setIsLoading(false);
    };

    init();

    return () => window.removeEventListener("resize", handleResize);
  }, [navigate, showNotification]);

  // Listen for foreground FCM messages
  useEffect(() => {
    if (
      messaging &&
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("Foreground message received.", payload);
        const title = payload.notification?.title || "Nueva notificación";
        const body = payload.notification?.body || "";
        showNotification("success", `${title}: ${body}`);
      });
      return () => unsubscribe();
    }
  }, [showNotification]);

  const fetchAlarms = useCallback(
    async (currentUserId: number) => {
      const { data, error } = await supabase
        .from("walks")
        .select("*")
        .eq("user_id", currentUserId);

      if (error) {
        showNotification("error", "No se pudieron cargar las alarmas.");
        return;
      }

      if (data && data.length > 0) {
        const loadedAlarms = data.map((alarm) => ({
          ...alarm,
          time: alarm.time ? dayjs(alarm.time, "HH:mm:ss").tz(TIMEZONE) : null,
        }));
        setAlarms(loadedAlarms);
      } else {
        // Start with a default alarm if none exist
        addAlarm(true);
      }
    },
    [showNotification]
  );

  const initFCM = async (localUser: {
    id: number;
    fcm_token: string | null;
  }) => {
    try {
      const token = await getOrCreateFCMToken();
      if (token) {
        console.log("[FCM] Token:", token);
        if (token !== localUser.fcm_token) {
          const { error } = await supabase
            .from("Users")
            .update({ fcm_token: token })
            .eq("id", localUser.id);
          if (error) throw error;
          showNotification("success", "Notificaciones activadas.");
        }
      } else {
        showNotification(
          "warning",
          "No se pudo obtener el token para notificaciones."
        );
      }
    } catch (error) {
      console.error("Error initializing FCM:", error);
      showNotification("error", "No se pudieron habilitar las notificaciones.");
    }
  };

  // --- Alarm Management ---
  const handleAlarmChange = (
    index: number,
    field: keyof PaseoAlarm,
    value: any
  ) => {
    const updatedAlarms = [...alarms];
    (updatedAlarms[index] as any)[field] = value;
    setAlarms(updatedAlarms);
  };

  const toggleDay = (index: number, dayId: string) => {
    const updatedAlarms = [...alarms];
    const currentDays = updatedAlarms[index].days || [];
    const dayIndex = currentDays.indexOf(dayId);

    if (dayIndex > -1) {
      updatedAlarms[index].days = currentDays.filter((d) => d !== dayId);
    } else {
      updatedAlarms[index].days = [...currentDays, dayId];
    }
    setAlarms(updatedAlarms);
  };

  const addAlarm = (isDefault = false) => {
    const newAlarm: PaseoAlarm = {
      id: `new-${Date.now()}`,
      name: "Paseo de la mañana",
      days: [],
      time: dayjs().tz(TIMEZONE).hour(8).minute(0),
      active: true,
      user_id: userId!,
    };
    if (isDefault) {
      setAlarms([newAlarm]);
    } else {
      setAlarms([...alarms, newAlarm]);
    }
  };

  const deleteAlarm = async (id: string) => {
    // Optimistic UI update
    const originalAlarms = [...alarms];
    setAlarms(alarms.filter((alarm) => alarm.id !== id));

    if (!id.startsWith("new-")) {
      const { error } = await supabase.from("walks").delete().eq("id", id);
      if (error) {
        showNotification("error", "No se pudo eliminar la actividad.");
        setAlarms(originalAlarms); // Revert on error
      }
    }
  };

  // --- Send notification via Supabase ---
  const sendPaseoNotification = useCallback(
    async (
      currentUserId: number,
      message: string,
      type: "success" | "error" | "warning" | "info" = "success"
    ) => {
      try {
        const { error } = await supabase.from("food_notifications").insert([
          {
            user_id: currentUserId,
            message,
            type,
            created_at: new Date().toISOString(),
          },
        ]);
        if (error) {
          showNotification("error", `Supabase: ${error.message}`);
          throw error;
        }
        return true;
      } catch (error: any) {
        const msg = error?.message || error?.toString() || "Error desconocido";
        showNotification("error", `Notificación fallida: ${msg}`);
        console.error("Error al enviar notificación:", error);
        return false;
      }
    },
    [showNotification]
  );

  // --- Test an alarm immediately ---
  const testAlarm = async (alarmIndex: number) => {
    const alarm = alarms[alarmIndex];
    if (!alarm.name.trim()) {
      showNotification("warning", "Agrega un nombre para probar la alarma");
      return;
    }
    if (!userId) {
      showNotification("error", "No hay usuario autenticado");
      return;
    }

    const ua = navigator.userAgent;
    const isChromium = /Chrome|Chromium|Edg|Brave|Opera/i.test(ua);
    const isWebView =
      /wv|WebView|; wv\)/i.test(ua) ||
      (window.navigator.userAgent.includes("Version/") &&
        window.navigator.userAgent.includes("Mobile/"));

    try {
      const dias =
        alarm.days.length > 0 ? `Días: ${alarm.days.join(", ")}` : "";
      const hora = alarm.time
        ? alarm.time.format("h:mm A")
        : "hora no definida";
      const testMessage = `¡Recordatorio de prueba! Es hora de salir a ${alarm.name} a las ${hora}. ${dias}`;
      showNotification("success", testMessage);

      // Supabase
      await sendPaseoNotification(userId, testMessage, "info");

      // Web Push / Notification API
      if ("Notification" in window && Notification.permission === "granted") {
        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(`¡Hora de ${alarm.name}!`, {
              body: `¡Es hora de salir a ${alarm.name} a las ${hora}! ${dias}`,
              icon: "/public/images/logo_gradient.png",
              badge: "/public/images/logo_gradient.png",
              data: { url: window.location.origin },
            });
            return;
          } catch {
            /* fallback */
          }
        }
        try {
          new Notification(`¡Hora de ${alarm.name}!`, {
            body: `¡Es hora de salir a ${alarm.name} a las ${hora}! ${dias}`,
            icon: "/public/images/logo_gradient.png",
            badge: "/public/images/logo_gradient.png",
            data: { url: window.location.origin },
          });
        } catch {
          if (isWebView) {
            showNotification(
              "warning",
              "Este WebView no soporta notificaciones push. Usa el navegador para recibir alertas."
            );
          } else if (isChromium) {
            showNotification(
              "warning",
              "No se pudo mostrar la notificación push. Verifica los permisos o prueba en modo PWA."
            );
          }
        }
      }
    } catch (error) {
      console.error("Error al probar la alarma:", error);
      showNotification("error", "Error al probar la alarma");
    }
  };

  const schedulePaseo = async (alarmIndex: number) => {
    const alarm = alarms[alarmIndex];
    if (!alarm.name.trim()) {
      showNotification("warning", "Dale un nombre a la actividad.");
      return;
    }
    if (alarm.days.length === 0) {
      showNotification("warning", "Selecciona al menos un día.");
      return;
    }

    const timeUTC = alarm.time ? alarm.time.utc().format("HH:mm:ss") : null;

    const alarmData = {
      user_id: userId!,
      name: alarm.name,
      days: alarm.days,
      time: timeUTC,
      active: alarm.active,
    };

    let error;
    if (alarm.id.startsWith("new-")) {
      const { data, error: insertError } = await supabase
        .from("walks")
        .insert(alarmData)
        .select()
        .single();
      if (data) {
        const updatedAlarms = [...alarms];
        updatedAlarms[alarmIndex] = {
          ...updatedAlarms[alarmIndex],
          id: data.id,
        };
        setAlarms(updatedAlarms);
      }
      error = insertError;
    } else {
      const { error: updateError } = await supabase
        .from("walks")
        .update(alarmData)
        .eq("id", alarm.id);
      error = updateError;
    }

    if (error) {
      showNotification("error", "No se pudo guardar la actividad.");
      console.error("Error saving walk:", error);
    } else {
      showNotification("success", `Actividad '${alarm.name}' guardada.`);
    }
  };

  // --- UI Rendering ---
  const renderSkeleton = () => (
    <div className="paseos-container-skeleton">
      <div className="paseos-skeleton-title"></div>
      <div className="paseos-skeleton-days-container">
        {Array(7)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="paseos-skeleton-day-button"></div>
          ))}
      </div>
      <div className="paseos-skeleton-time-picker"></div>
      <div className="paseos-skeleton-schedule-button"></div>
    </div>
  );

  const daysOfWeek = [
    { id: "L", label: "L" },
    { id: "M", label: "M" },
    { id: "m", label: "M" },
    { id: "J", label: "J" },
    { id: "V", label: "V" },
    { id: "S", label: "S" },
    { id: "D", label: "D" },
  ];

  return (
    <div className="paseos-section">
      {notifications.map((n) => (
        <AlertMessage
          key={n.id}
          message={n.message}
          type={n.type}
          onClose={() => closeNotification(n.id)}
        />
      ))}

      {isLoading ? (
        renderSkeleton()
      ) : (
        <>
          <h2 className="paseos-title">Programar Actividades</h2>
          <div>
            {alarms.map((alarm, idx) => (
              <div key={alarm.id} className="paseos-alarm-card">
                <button
                  className="paseos-delete-alarm-btn"
                  onClick={() => deleteAlarm(alarm.id)}
                  aria-label="Eliminar actividad"
                >
                  <FaTimes />
                </button>

                <input
                  type="text"
                  placeholder="Nombre de la actividad"
                  value={alarm.name}
                  onChange={(e) =>
                    handleAlarmChange(idx, "name", e.target.value)
                  }
                  className="paseos-alarm-name"
                />

                <div className="paseos-days-container">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.id}
                      className={`paseos-day-button ${
                        alarm.days.includes(day.id) ? "selected" : ""
                      }`}
                      onClick={() => toggleDay(idx, day.id)}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>

                <div className="paseos-time-picker-container">
                  {isMobile ? (
                    <input
                      type="time"
                      value={alarm.time ? alarm.time.format("HH:mm") : ""}
                      onChange={(e) => {
                        const [h, m] = e.target.value.split(":");
                        handleAlarmChange(
                          idx,
                          "time",
                          dayjs().tz(TIMEZONE).hour(Number(h)).minute(Number(m))
                        );
                      }}
                      className="paseos-time-picker"
                    />
                  ) : (
                    <TimePicker
                      value={alarm.time}
                      onChange={(time) => handleAlarmChange(idx, "time", time)}
                      format="h:mm A"
                      use12Hours
                      className="paseos-time-picker"
                    />
                  )}
                </div>

                <div className="paseos-button-group">
                  <button
                    className="paseos-save-button"
                    onClick={() => schedulePaseo(idx)}
                  >
                    Guardar Actividad
                  </button>
                  <button
                    className="paseos-test-button"
                    onClick={() => testAlarm(idx)}
                    title="Probar alarma ahora"
                  >
                    Probar
                  </button>
                </div>
              </div>
            ))}

            <button
              className="paseos-add-alarm-btn"
              onClick={() => addAlarm(false)}
            >
              <FaPlus />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Paseos;
