import React, { useState, useEffect, useCallback } from "react";
import { TimePicker } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { FaPlus, FaTimes } from "react-icons/fa";
import "../styles/Paseos.css";
import "../styles/style.css";
import supabase from "../supabase";
import { useNavigate } from "react-router-dom";
import AlertMessage from "./AlertMessage";
import { messaging, onMessage, getOrCreateFCMToken } from "../../firebase";

// Configurar dayjs para manejo de timezone (CDMX)
dayjs.extend(utc);
dayjs.extend(timezone);
const TIMEZONE = "America/Mexico_City";

// Función para convertir la hora local a UTC para almacenamiento

// Función para convertir UTC a hora local para visualización
const utcToLocal = (time: string | null) => {
  if (!time) return null;
  return dayjs.utc(time).tz(TIMEZONE);
};

// Función auxiliar para transformar cadenas "HH:mm" o "HH:mm:ss" en objetos dayjs
// y ajustarlas a la zona horaria local especificada
const parseHourToLocal = (hour: string | null): dayjs.Dayjs | null => {
  if (!hour) return null;
  // Si sólo viene HH:mm añadimos los segundos para evitar errores
  const normalized = hour.split(":").length === 2 ? `${hour}:00` : hour;
  return utcToLocal(`2000-01-01T${normalized}Z`);
};

const daysOfWeek = [
  { id: "L", label: "Lunes" },
  { id: "M", label: "Martes" },
  { id: "m", label: "Miércoles" },
  { id: "J", label: "Jueves" },
  { id: "V", label: "Viernes" },
  { id: "S", label: "Sábado" },
  { id: "D", label: "Domingo" },
];

interface FoodAlarm {
  id: string;
  name: string;
  days: string[];
  time: dayjs.Dayjs | null;
  lastNotification?: string;
  user_id?: number;
  active?: boolean;
}

const Foods: React.FC = () => {
  const navigate = useNavigate();
  const [alarms, setAlarms] = useState<FoodAlarm[]>([]);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "error" | "warning";
      message: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  // Mostrar notificación visual
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

  // Cerrar notificación manualmente
  const closeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Obtener el ID del usuario autenticado
  const checkUser = useCallback(async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error("Error de sesión:", error);
      navigate("/login");
      return null;
    }

    try {
      const { data: localUser, error: userError } = await supabase
        .from("Users")
        .select("id")
        .eq("email", user.email)
        .single();

      if (userError || !localUser?.id) {
        throw new Error("Usuario no encontrado");
      }

      setUserId(localUser.id);
      return localUser.id;
    } catch (error) {
      console.error("Error al obtener el usuario:", error);
      showNotification("error", "Error al cargar el perfil del usuario");
      return null;
    }
  }, [navigate, showNotification]);

  // Configurar notificaciones en tiempo real
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`food_notifications_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "food_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const notification = payload.new;
          if (notification) {
            showNotification(
              notification.type || "success",
              notification.message || "¡Es hora de alimentar a tu mascota!"
            );

            // Compatibilidad total: siempre intenta Service Worker primero
            if (
              "serviceWorker" in navigator &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              navigator.serviceWorker.ready
                .then((registration) => {
                  registration.showNotification(`¡Hora de comer!`, {
                    body:
                      notification.message ||
                      "¡Es hora de alimentar a tu mascota!",
                    icon: "/public/images/logo_gradient.png",
                    badge: "/public/images/logo_gradient.png",
                    data: { url: window.location.origin },
                  });
                })
                .catch(() => {
                  // Fallback clásico
                  new Notification(`¡Hora de comer!`, {
                    body:
                      notification.message ||
                      "¡Es hora de alimentar a tu mascota!",
                    icon: "/public/images/logo_gradient.png",
                    badge: "/public/images/logo_gradient.png",
                    data: { url: window.location.origin },
                  });
                });
            } else if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              // Fallback clásico si no hay Service Worker
              new Notification(`¡Hora de comer!`, {
                body:
                  notification.message || "¡Es hora de alimentar a tu mascota!",
                icon: "/public/images/logo_gradient.png",
                badge: "/public/images/logo_gradient.png",
                data: { url: window.location.origin },
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, showNotification]);

  // Solicitar permisos de notificación
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  // ---- INTEGRACIÓN FCM PARA PWA ----
  useEffect(() => {
    const initFCM = async () => {
      try {
        // Registrar el Service Worker de Firebase si aún no está registrado
        if ("serviceWorker" in navigator) {
          const existingRegistration = await navigator.serviceWorker
            .getRegistrations()
            .then((regs) =>
              regs.find((r) =>
                r.active?.scriptURL.includes("firebase-messaging-sw.js")
              )
            );

          if (!existingRegistration) {
            await navigator.serviceWorker.register("/firebase-messaging-sw.js");
          }
        }

        // Solicitar/obtener token FCM
        const token = await getOrCreateFCMToken();
        if (process.env.NODE_ENV === "development") {
          console.log("[FCM] Token:", token);
        }
      } catch (err) {
        console.error("[FCM] Error inicializando FCM:", err);
      }
    };

    // Ejecutar al montar el componente
    initFCM();

    // Escuchar mensajes en primer plano
    let unsubscribe: (() => void) | undefined;
    if (messaging) {
      unsubscribe = onMessage(messaging, (payload) => {
        if (process.env.NODE_ENV === "development") {
          console.log("[FCM] Mensaje en primer plano:", payload);
        }
        const title = payload.notification?.title ?? "PetConnect";
        const body = payload.notification?.body ?? "Nueva notificación";
        // Mostrar notificación en UI
        showNotification("success", body);

        // Intentar notificación nativa usando Service Worker
        if (
          "serviceWorker" in navigator &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, {
              body,
              icon: "/public/images/logo_gradient.png",
              badge: "/public/images/logo_gradient.png",
              data: payload.data,
            });
          });
        }
      });
    }

    // Cleanup
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [showNotification]);

  // Detectar si es móvil para usar input nativo de hora
  const isMobile =
    typeof window !== "undefined" &&
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
      navigator.userAgent
    );

  // Cargar alarmas desde la base de datos
  const fetchAlarms = useCallback(
    async (userId: number) => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("food_alarms")
          .select("*")
          .eq("user_id", userId)
          .eq("active", true);

        if (error) throw error;

        if (data) {
          const formattedAlarms = data.map((alarm) => {
            // Convertir la hora almacenada (asumida como UTC) a la zona horaria local
            const localTime = alarm.hour ? parseHourToLocal(alarm.hour) : null;

            return {
              id: alarm.id.toString(),
              name: alarm.title,
              days: alarm.days || [],
              time: localTime || dayjs().tz(TIMEZONE).hour(12).minute(0),
              lastNotification: "",
              user_id: alarm.user_id,
              active: alarm.active,
            };
          });
          setAlarms(formattedAlarms);
        }
      } catch (error) {
        console.error("Error al cargar alarmas:", error);
        showNotification("error", "Error al cargar las alarmas");
      } finally {
        setIsLoading(false);
      }
    },
    [showNotification]
  );

  // Inicializar datos
  useEffect(() => {
    const init = async () => {
      const userId = await checkUser();
      if (userId) {
        await fetchAlarms(userId);
      }
    };

    init();
  }, [checkUser, fetchAlarms]);

  // --- Lógica de chequeo local de alarmas de comida (como en Paseos) ---
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let lastCheckDate = "";

    const checkAlarms = async () => {
      if (!userId) return;
      const now = dayjs().tz(TIMEZONE);
      const currentHour = now.hour();
      const currentMinute = now.minute();
      const currentDay = now.format("dddd");
      const currentDayLetter = {
        Monday: "L",
        Tuesday: "M",
        Wednesday: "m",
        Thursday: "J",
        Friday: "V",
        Saturday: "S",
        Sunday: "D",
      }[currentDay];
      const todayDate = now.format("YYYY-MM-DD");

      const activeAlarms = alarms.filter(
        (alarm) =>
          alarm.active && alarm.time && alarm.days.length > 0 && alarm.name
      );
      if (activeAlarms.length === 0) return;

      activeAlarms.forEach(async (alarm) => {
        if (!alarm.time) return;
        // ¿Es el día correcto?
        if (!currentDayLetter || !alarm.days.includes(currentDayLetter)) return;
        const alarmHour = alarm.time.hour();
        const alarmMinute = alarm.time.minute();
        // ¿Coincide la hora y minuto?
        if (currentHour !== alarmHour || currentMinute !== alarmMinute) return;
        // ¿Ya se notificó hoy?
        const lastNotificationDate = alarm.lastNotification
          ? dayjs(alarm.lastNotification).tz(TIMEZONE).format("YYYY-MM-DD")
          : null;
        if (lastNotificationDate === todayDate) return;
        // Enviar notificación a través de Supabase
        await sendFoodNotification(
          userId,
          `¡Es hora de alimentar a ${alarm.name} a las ${alarm.time.format(
            "h:mm A"
          )}`,
          "success"
        );
        // Actualizar la fecha de última notificación localmente
        setAlarms((prev) =>
          prev.map((a) =>
            a.id === alarm.id
              ? { ...a, lastNotification: now.toISOString() }
              : a
          )
        );
      });
    };

    const startChecking = () => {
      const now = dayjs().tz(TIMEZONE);
      const currentDate = now.format("YYYY-MM-DD");
      if (lastCheckDate !== currentDate) {
        lastCheckDate = currentDate;
        if (alarms.length > 0 && userId) {
          checkAlarms();
        }
      }
      const msUntilNextMinute = (60 - now.second()) * 1000 - now.millisecond();
      setTimeout(() => {
        checkAlarms();
        intervalId = setInterval(checkAlarms, 60000);
      }, msUntilNextMinute);
    };

    startChecking();
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarms, userId]);

  // Manejar cambios en las alarmas
  const handleAlarmChange = (
    index: number,
    field: keyof FoodAlarm,
    value: any
  ) => {
    setAlarms((prev) => {
      const newAlarms = [...prev];
      newAlarms[index] = { ...newAlarms[index], [field]: value };
      return newAlarms;
    });
  };

  // Alternar día de la semana
  const toggleDay = (index: number, dayId: string) => {
    setAlarms((prev) => {
      const newAlarms = [...prev];
      const alarm = { ...newAlarms[index] };

      if (alarm.days.includes(dayId)) {
        alarm.days = alarm.days.filter((d) => d !== dayId);
      } else {
        alarm.days = [...alarm.days, dayId];
      }

      newAlarms[index] = alarm;
      return newAlarms;
    });
  };

  // Agregar nueva alarma
  const addAlarm = () => {
    setAlarms((prev) => [
      ...prev,
      {
        id: `temp_${Date.now()}`,
        name: "",
        days: [],
        time: dayjs().hour(21).minute(0),
        active: true,
      },
    ]);
  };

  // Eliminar alarma
  const deleteAlarm = async (id: string) => {
    try {
      await deleteAlarmFromDatabase(id);
      setAlarms((prev) => prev.filter((a) => a.id !== id));
      showNotification("success", "Alarma eliminada correctamente");
    } catch (error) {
      console.error("Error al eliminar la alarma:", error);
      showNotification("error", "Error al eliminar la alarma");
    }
  };

  // Guardar alarma en la base de datos
  const saveAlarmToDatabase = async (alarm: FoodAlarm) => {
    if (!userId) {
      showNotification("error", "No hay usuario autenticado");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("food_alarms")
        .insert([
          {
            user_id: userId,
            title: alarm.name,
            days: alarm.days,
            hour: alarm.time ? alarm.time.tz(TIMEZONE).format("HH:mm") : null,
            active: true,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      showNotification("success", "¡Recordatorio de comida programado!");

      // Enviar notificación de confirmación
      if (userId) {
        await sendFoodNotification(
          userId,
          `Se ha programado la comida para ${
            alarm.name
          } a las ${alarm.time?.format("h:mm A")}`
        );
      }

      return data?.[0];
    } catch (error) {
      console.error("Error al guardar la alarma:", error);
      showNotification("error", "Error al guardar la alarma");
      return null;
    }
  };

  // Actualizar alarma en la base de datos
  const updateAlarmInDatabase = async (alarm: FoodAlarm) => {
    if (!userId) {
      showNotification("error", "No hay usuario autenticado");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("food_alarms")
        .update({
          title: alarm.name,
          days: alarm.days,
          hour: alarm.time ? alarm.time.tz(TIMEZONE).format("HH:mm") : null,
          active: alarm.active,
        })
        .eq("id", alarm.id)
        .select();

      if (error) throw error;

      showNotification("success", "Alarma actualizada correctamente");
      return data?.[0];
    } catch (error) {
      console.error("Error al actualizar la alarma:", error);
      showNotification("error", "Error al actualizar la alarma");
      return null;
    }
  };

  // Eliminar alarma de la base de datos
  const deleteAlarmFromDatabase = async (alarmId: string) => {
    try {
      const { error } = await supabase
        .from("food_alarms")
        .delete()
        .eq("id", alarmId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error al eliminar la alarma:", error);
      throw error;
    }
  };

  // Programar una alarma
  const scheduleAlarm = async (alarmIndex: number) => {
    const alarm = alarms[alarmIndex];
    if (alarm.days.length === 0 || !alarm.time || !alarm.name.trim()) {
      showNotification(
        "warning",
        "Completa el nombre, días y hora para la alarma"
      );
      return;
    }

    try {
      let updatedAlarm;

      if (alarm.id && !isNaN(parseInt(alarm.id))) {
        updatedAlarm = await updateAlarmInDatabase(alarm);
      } else {
        updatedAlarm = await saveAlarmToDatabase(alarm);
      }

      if (updatedAlarm) {
        // Actualizar el estado local
        setAlarms((prev) =>
          prev.map((a, idx) =>
            idx === alarmIndex
              ? {
                  ...a,
                  id: updatedAlarm.id.toString(),
                  name: updatedAlarm.title,
                  days: updatedAlarm.days,
                  time: parseHourToLocal(updatedAlarm.hour),
                  active: updatedAlarm.active,
                  lastNotification: undefined,
                }
              : a
          )
        );

        showNotification(
          "success",
          `Comida para "${alarm.name}" programada para ${alarm.days.join(
            ", "
          )} a las ${alarm.time.format("h:mm A")}`
        );
      }
    } catch (error) {
      console.error("Error al programar la comida:", error);
      showNotification(
        "error",
        "Error al programar la comida. Por favor, inténtalo de nuevo."
      );
    }
  };

  // Enviar notificación a través de Supabase
  const sendFoodNotification = useCallback(
    async (userId: number, message: string, type = "success") => {
      try {
        const { error } = await supabase.from("food_notifications").insert([
          {
            user_id: userId,
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
    []
  );

  // Probar una alarma
  const testAlarm = async (alarmIndex: number) => {
    const alarm = alarms[alarmIndex];
    if (!alarm.name) {
      showNotification("warning", "Agrega un nombre para probar la alarma");
      return;
    }

    if (!userId) {
      showNotification("error", "No hay usuario autenticado");
      return;
    }

    // Detección básica de Chromium y WebView
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
      const testMessage = `¡Recordatorio de prueba! Es hora de alimentar a ${alarm.name} a las ${hora}. ${dias}`;
      showNotification("success", testMessage);

      // Enviar notificación a través de Supabase
      await sendFoodNotification(userId, testMessage, "info");

      // Mostrar notificación push usando Service Worker si está disponible
      if ("Notification" in window && Notification.permission === "granted") {
        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(
              `¡Hora de comer, ${alarm.name}!`,
              {
                body: `¡Es hora de alimentar a ${alarm.name} a las ${hora}! ${dias}`,
                icon: "/public/images/logo_gradient.png",
                badge: "/public/images/logo_gradient.png",
                data: { url: window.location.origin },
              }
            );
            if (process.env.NODE_ENV === "development") {
              console.log(
                "Notificación mostrada vía Service Worker (Chromium/PWA)"
              );
            }
            return;
          } catch (err) {
            if (process.env.NODE_ENV === "development") {
              console.warn(
                "Fallo Service Worker, intentando Notification directa",
                err
              );
            }
            // Fallback a notificación clásica si falla el Service Worker
          }
        }
        // Fallback a notificación clásica si no hay Service Worker o falló
        try {
          new Notification(`¡Hora de comer, ${alarm.name}!`, {
            body: `¡Es hora de alimentar a ${alarm.name} a las ${hora}! ${dias}`,
            icon: "/public/images/logo_gradient.png",
            badge: "/public/images/logo_gradient.png",
            data: { url: window.location.origin },
          });
          if (process.env.NODE_ENV === "development") {
            console.log("Notificación mostrada vía Notification directa");
          }
        } catch (err2) {
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
          } else {
            showNotification(
              "warning",
              "No se pudo mostrar la notificación push en este dispositivo/navegador."
            );
          }
        }
      } else {
        if (isWebView) {
          showNotification(
            "warning",
            "Este WebView no soporta notificaciones push. Usa el navegador para recibir alertas."
          );
        } else if (isChromium) {
          showNotification(
            "warning",
            "Activa los permisos de notificaciones en tu navegador para recibir alertas."
          );
        } else {
          showNotification(
            "warning",
            "El navegador no permite notificaciones push o no se han concedido permisos."
          );
        }
      }
    } catch (error) {
      console.error("Error al probar la alarma:", error);
      showNotification("error", "Error al probar la alarma");
    }
  };

  // Renderizar esqueleto de carga
  const renderSkeleton = () => (
    <div className="FOODS-container-skeleton">
      <div className="FOODS-skeleton-title"></div>
      <div className="FOODS-skeleton-days-container">
        {Array(7)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="FOODS-skeleton-day-button"></div>
          ))}
      </div>
      <div className="FOODS-skeleton-time-picker"></div>
      <div className="FOODS-skeleton-schedule-button"></div>
    </div>
  );

  return (
    <div className="FOODS-section">
      {/* Notificaciones visuales usando AlertMessage */}
      {notifications.map((notification) => (
        <AlertMessage
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => closeNotification(notification.id)}
        />
      ))}

      {isLoading ? (
        renderSkeleton()
      ) : (
        <>
          <h2 className="FOODS-title"> Programar Comidas </h2>
          <div>
            {alarms.map((alarm, idx) => (
              <div key={alarm.id} className="FOODS-alarm-card">
                <button
                  className="FOODS-delete-alarm-btn"
                  onClick={() => deleteAlarm(alarm.id)}
                  aria-label="Eliminar alarma"
                  title="Eliminar alarma"
                >
                  <FaTimes />
                </button>

                <input
                  type="text"
                  placeholder="Nombre de la mascota"
                  value={alarm.name}
                  onChange={(e) =>
                    handleAlarmChange(idx, "name", e.target.value)
                  }
                  className="FOODS-alarm-name"
                />

                <div className="FOODS-days-container">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.id}
                      className={`FOODS-day-button ${
                        alarm.days.includes(day.id) ? "selected" : ""
                      }`}
                      onClick={() => toggleDay(idx, day.id)}
                    >
                      {day.id}
                    </button>
                  ))}
                </div>

                <div className="FOODS-time-picker-container">
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
                      className="FOODS-time-picker"
                      style={{ width: "100%", maxWidth: 200 }}
                    />
                  ) : (
                    <TimePicker
                      value={alarm.time}
                      onChange={(time) => handleAlarmChange(idx, "time", time)}
                      format="h:mm A"
                      use12Hours
                      className="FOODS-time-picker"
                    />
                  )}
                </div>

                <div className="FOODS-button-group">
                  <button
                    className="FOODS-save-button"
                    onClick={() => scheduleAlarm(idx)}
                  >
                    Programar comida
                  </button>
                  <button
                    className="FOODS-test-button"
                    onClick={() => testAlarm(idx)}
                    title="Probar alarma ahora"
                  >
                    Probar
                  </button>
                </div>
              </div>
            ))}

            <button className="FOODS-add-alarm-btn" onClick={addAlarm}>
              <FaPlus />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Foods;
