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

// Configurar dayjs para manejo de timezone (CDMX)
dayjs.extend(utc);
dayjs.extend(timezone);
const TIMEZONE = "America/Mexico_City"; // Timezone para CDMX

const daysOfWeek = [
  { id: "L", label: "Lunes" },
  { id: "M", label: "Martes" },
  { id: "m", label: "Miércoles" },
  { id: "J", label: "Jueves" },
  { id: "V", label: "Viernes" },
  { id: "S", label: "Sábado" },
  { id: "D", label: "Domingo" },
];

// Mapeo de letras de día a números de día de la semana (formato JavaScript)
const dayLetterToNumber: Record<string, number> = {
  L: 1, // Lunes es 1 en JavaScript (0 es Domingo)
  M: 2, // Martes
  m: 3, // Miércoles
  J: 4, // Jueves
  V: 5, // Viernes
  S: 6, // Sábado
  D: 0, // Domingo es 0 en JavaScript
};

interface PaseoAlarm {
  id: string;
  name: string;
  days: string[];
  time: dayjs.Dayjs | null;
  lastNotification?: string;
  user_id?: number;
  active?: boolean;
}

const Paseos: React.FC = () => {
  const navigate = useNavigate();
  // Estados
  const [alarms, setAlarms] = useState<PaseoAlarm[]>([
    {
      id: Date.now().toString(),
      name: "",
      days: [],
      time: dayjs().hour(21).minute(0),
      active: true,
    },
  ]);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "error" | "warning";
      message: string;
    }>
  >([]);
  const [showSkeleton, setShowSkeleton] = useState(true);
  // Loading state is now managed by showSkeleton
  const [userId, setUserId] = useState<number | null>(null);

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

  // Función para cerrar manualmente una notificación
  const closeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Obtener el user_id del usuario autenticado
  const checkUser = async () => {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getUser();

    if (sessionError || !sessionData?.user) {
      console.error("Error de sesión:", sessionError);
      navigate("/login");
      return null;
    }

    try {
      const { data: localUser, error: localUserError } = await supabase
        .from("Users")
        .select("id")
        .eq("email", sessionData.user.email)
        .single();

      if (localUserError || !localUser?.id) {
        console.error("Error al obtener el usuario local:", localUserError);
        showNotification(
          "error",
          "No se encontró tu usuario local. Verifica la tabla 'Users'."
        );
        return null;
      }

      const foundUserId = localUser.id;
      setUserId(foundUserId);
      console.log("ID del usuario local:", foundUserId);
      return foundUserId;
    } catch (e) {
      console.error("Error al identificar el usuario:", e);
      showNotification("error", "Error al identificar el usuario");
      return null;
    }
  };

  // Cargar alarmas desde la base de datos
  const fetchAlarms = async (userIdParam: number) => {
    try {
      // Loading state is handled by showSkeleton
      const { data, error } = await supabase
        .from("walks")
        .select("*")
        .eq("user_id", userIdParam)
        .eq("active", true);

      if (error) throw error;

      if (data) {
        const formattedAlarms = data.map((alarm) => ({
          id: alarm.id.toString(),
          name: alarm.title,
          days: alarm.days || [],
          time: dayjs(alarm.hour, "HH:mm"),
          lastNotification: "",
          user_id: alarm.user_id,
          active: alarm.active,
        }));
        setAlarms(formattedAlarms);
      }
    } catch (error) {
      console.error("Error al cargar alarmas:", error);
      showNotification("error", "Error al cargar las alarmas");
    } finally {
      setShowSkeleton(false);
    }
  };

  // Guardar alarma en la base de datos
  const saveAlarmToDatabase = async (alarm: PaseoAlarm) => {
    if (!userId) {
      showNotification("error", "No hay usuario autenticado");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("walks")
        .insert([
          {
            user_id: userId,
            title: alarm.name,
            days: alarm.days,
            hour: alarm.time?.format("HH:mm"),
            active: true,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      showNotification("success", "Alarma guardada correctamente");
      return data?.[0];
    } catch (error) {
      console.error("Error al guardar la alarma:", error);
      showNotification("error", "Error al guardar la alarma");
      return null;
    }
  };

  // Actualizar alarma en la base de datos
  const updateAlarmInDatabase = async (alarm: PaseoAlarm) => {
    if (!userId) {
      showNotification("error", "No hay usuario autenticado");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("walks")
        .update({
          title: alarm.name,
          days: alarm.days,
          hour: alarm.time?.format("HH:mm"),
          active: true,
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
    if (!userId) {
      showNotification("error", "No hay usuario autenticado");
      return;
    }

    try {
      const { error } = await supabase.from("walks").delete().eq("id", alarmId);

      if (error) throw error;

      // Actualizar el estado local eliminando la alarma
      setAlarms((prevAlarms) =>
        prevAlarms.filter((alarm) => alarm.id !== alarmId)
      );
      showNotification("success", "Alarma eliminada correctamente");
    } catch (error) {
      console.error("Error al eliminar la alarma:", error);
      showNotification("error", "Error al eliminar la alarma");
    }
  };

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
              notification.message || "¡Es hora de sacar a pasear a tu mascota!"
            );

            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification("Recordatorio de paseo", {
                body:
                  notification.message ||
                  "¡Es hora de sacar a pasear a tu mascota!",
                icon: "/logo192.png",
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

  // Función para enviar notificación de prueba
  const testNotification = async (alarm: PaseoAlarm) => {
    if (!userId) {
      showNotification("error", "No hay usuario autenticado");
      return;
    }

    try {
      const testMessage = `¡Recordatorio de prueba! Es hora de pasear a ${alarm.name}`;

      // Insertar notificación de prueba en food_notifications
      const { error } = await supabase.from("food_notifications").insert([
        {
          user_id: userId,
          message: testMessage,
          type: "test",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      showNotification("success", "Notificación de prueba enviada");
    } catch (error) {
      console.error("Error al enviar notificación de prueba:", error);
      showNotification("error", "Error al enviar notificación de prueba");
    }
  };

  // Función para enviar notificación de paseo
  const sendWalkNotification = useCallback(
    async (alarm: PaseoAlarm) => {
      if (!userId) {
        console.warn("No hay usuario autenticado para enviar notificaciones");
        return;
      }

      try {
        // Notificación enviada a través de Supabase
        const message = `Es momento de sacar a pasear a ${alarm.name}`;

        // Insertar notificación en food_notifications
        const { error } = await supabase.from("food_notifications").insert([
          {
            user_id: userId,
            message,
            type: "reminder",
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;

        // Actualizar la fecha de última notificación
        const now = dayjs().tz(TIMEZONE).format();

        // Actualizar estado local
        setAlarms((prev) =>
          prev.map((a) =>
            a.id === alarm.id ? { ...a, lastNotification: now } : a
          )
        );

        console.log(`Notificación de paseo programada para ${alarm.name}`);
      } catch (error) {
        console.error("Error al programar notificación de paseo:", error);
        showNotification(
          "error",
          "Error al programar la notificación de paseo"
        );
      }
    },
    [userId, showNotification]
  );

  // Función para verificar las alarmas con mejor precisión
  const checkAlarms = useCallback(() => {
    // Verificar si tenemos userId
    if (!userId) {
      console.log("No hay usuario autenticado para verificar alarmas");
      return;
    }

    const now = dayjs().tz(TIMEZONE);
    const currentHour = now.hour();
    const currentMinute = now.minute();
    const currentDay = now.day();
    const todayDate = now.format("YYYY-MM-DD");

    // Solo verificar si hay alarmas activas
    const activeAlarms = alarms.filter(
      (alarm) =>
        alarm.active && alarm.time && alarm.days.length > 0 && alarm.name
    );

    if (activeAlarms.length === 0) {
      return;
    }

    console.log(
      `Verificando ${activeAlarms.length} alarmas activas: ${now.format(
        "HH:mm:ss"
      )} - Día: ${currentDay}`
    );

    activeAlarms.forEach((alarm) => {
      if (!alarm.time) return;

      // Verificar si es el día correcto
      const isScheduledDay = alarm.days.some(
        (dayLetter) => dayLetterToNumber[dayLetter] === currentDay
      );

      if (!isScheduledDay) {
        return;
      }

      const alarmHour = alarm.time.hour();
      const alarmMinute = alarm.time.minute();

      // Verificar si la hora actual coincide exactamente con la hora programada
      if (currentHour !== alarmHour || currentMinute !== alarmMinute) {
        return;
      }

      // Verificar si ya se envió notificación hoy
      const lastNotificationDate = alarm.lastNotification
        ? dayjs(alarm.lastNotification).tz(TIMEZONE).format("YYYY-MM-DD")
        : null;

      if (lastNotificationDate === todayDate) {
        console.log(`Ya se envió notificación hoy para ${alarm.name}`);
        return;
      }

      console.log(
        `¡Es hora de notificar! ${alarm.name} - ${alarmHour}:${alarmMinute}`
      );

      // Enviar notificación una sola vez
      sendWalkNotification(alarm);
    });
  }, [alarms, userId, sendWalkNotification]);

  // Mejorar el intervalo de verificación de alarmas
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let lastCheckDate = "";

    const startChecking = () => {
      console.log("Iniciando verificación de alarmas...");

      const now = dayjs().tz(TIMEZONE);
      const currentDate = now.format("YYYY-MM-DD");

      // Solo verificar si es un nuevo día o si es la primera vez
      if (lastCheckDate !== currentDate) {
        lastCheckDate = currentDate;

        // Verificar inmediatamente al iniciar
        if (alarms.length > 0 && !showSkeleton && userId) {
          checkAlarms();
        }
      }

      // Calcular el próximo minuto exacto para sincronizar
      const msUntilNextMinute = (60 - now.second()) * 1000 - now.millisecond();

      // Esperar hasta el próximo minuto exacto antes de iniciar el intervalo
      setTimeout(() => {
        checkAlarms();
        // Verificar cada minuto
        intervalId = setInterval(checkAlarms, 60000);
        console.log(
          "Intervalo de verificación de alarmas iniciado (cada minuto)"
        );
      }, msUntilNextMinute);
    };

    startChecking();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log("Intervalo de verificación de alarmas detenido");
      }
    };
  }, [alarms, checkAlarms, showSkeleton, userId]);

  // Modificar la función schedulePaseo para actualizar correctamente el estado
  const schedulePaseo = async (index: number) => {
    const alarm = alarms[index];
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
        // Actualizar alarma existente
        updatedAlarm = await updateAlarmInDatabase(alarm);
      } else {
        // Crear nueva alarma
        updatedAlarm = await saveAlarmToDatabase(alarm);
      }

      if (updatedAlarm) {
        // Actualizar el estado local con los datos de la base de datos
        setAlarms((prev) =>
          prev.map((a, idx) =>
            idx === index
              ? {
                  ...a,
                  id: updatedAlarm.id.toString(),
                  name: updatedAlarm.title,
                  days: updatedAlarm.days,
                  time: dayjs(updatedAlarm.hour, "HH:mm"),
                  active: updatedAlarm.active,
                  lastNotification: undefined, // Resetear la última notificación
                }
              : a
          )
        );

        // Mostrar notificación de éxito
        showNotification(
          "success",
          `Paseo "${alarm.name}" programado para ${alarm.days.join(
            ", "
          )} a las ${alarm.time.format("h:mm A")}`
        );

        // Configurar notificación push si está habilitado
        if (Notification.permission === "granted") {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification("Paseo Programado", {
            body: `Paseo "${alarm.name}" programado para ${alarm.days.join(
              ", "
            )} a las ${alarm.time.format("HH:mm")}`,
            icon: "/images/Logo_gradient.png",
            tag: `programado-${alarm.id}-${Date.now()}`,
            data: {
              url: "/paseos",
              alarmId: alarm.id,
              isProgrammedNotification: true,
            },
          });
        }

        // Verificar inmediatamente si es hora de la alarma
        checkAlarms();
      }
    } catch (error) {
      console.error("Error al programar el paseo:", error);
      showNotification(
        "error",
        "Error al programar el paseo. Por favor, inténtalo de nuevo."
      );
    }
  };

  // Función para probar la alarma
  const testAlarm = async (index: number) => {
    const alarm = alarms[index];
    if (!alarm.name) {
      showNotification("warning", "Agrega un nombre para probar la alarma");
      return;
    }

    try {
      // Mostrar notificación de prueba
      await testNotification(alarm);
      showNotification("success", `Notificación de prueba para ${alarm.name}`);
    } catch (error) {
      console.error("Error al probar la notificación:", error);
      showNotification("error", "Error al probar la notificación");
    }
  };

  // Modificar useEffect para cargar alarmas al inicio
  useEffect(() => {
    const initialize = async () => {
      const currentUser = await checkUser();
      if (currentUser) {
        await fetchAlarms(currentUser);
      }
    };

    initialize();

    // Solicitar permisos de notificación al cargar el componente
    if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  // Carga inicial y efecto de skeleton
  useEffect(() => {
    // Registrar el tiempo de inicio para asegurar un mínimo de 2 segundos
    const startTime = Date.now();

    // Simulate loading data
    const loadData = async () => {
      // Cargar alarmas guardadas desde localStorage
      try {
        const savedAlarms: PaseoAlarm[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("paseoSchedule_")) {
            const alarmData = JSON.parse(localStorage.getItem(key) || "{}");
            savedAlarms.push({
              id: key.replace("paseoSchedule_", ""),
              name: alarmData.name || "",
              days: alarmData.days || [],
              time: alarmData.time ? dayjs(alarmData.time, "HH:mm") : null,
              lastNotification: alarmData.lastNotification || "",
              user_id: alarmData.user_id || undefined,
              active: alarmData.active || true,
            });
          }
        }

        if (savedAlarms.length > 0) {
          setAlarms(savedAlarms);
        }
      } catch (error) {
        console.error("Error al cargar alarmas guardadas:", error);
      }

      // Calcular cuánto tiempo ha pasado
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 2000 - elapsedTime);

      // Si ha pasado menos de 2 segundos, esperar el tiempo restante
      setTimeout(() => {
        setShowSkeleton(false);
      }, remainingTime);
    };

    loadData();
  }, []);

  // Función para manejar el cambio de estado activo/inactivo
  const handleActiveChange = async (index: number, checked: boolean) => {
    const alarm = alarms[index];

    try {
      // Actualizar en la base de datos
      const { error } = await supabase
        .from("walks")
        .update({ active: checked })
        .eq("id", alarm.id);

      if (error) throw error;

      // Actualizar estado local
      setAlarms((prev) =>
        prev.map((a, idx) => (idx === index ? { ...a, active: checked } : a))
      );

      showNotification(
        "success",
        `Alarma ${checked ? "activada" : "desactivada"} correctamente`
      );
    } catch (error) {
      console.error("Error al actualizar estado de la alarma:", error);
      showNotification("error", "Error al actualizar estado de la alarma");
    }
  };

  const handleAlarmChange = (
    index: number,
    field: keyof PaseoAlarm,
    value: any
  ) => {
    setAlarms((prev) => {
      const newAlarms = [...prev];
      newAlarms[index] = {
        ...newAlarms[index],
        [field]: value,
      };
      return newAlarms;
    });
  };

  const toggleDay = (index: number, id: string) => {
    setAlarms((prev) => {
      const newAlarms = [...prev];
      const alarm = { ...newAlarms[index] };
      if (alarm.days.includes(id)) {
        alarm.days = alarm.days.filter((d) => d !== id);
      } else {
        alarm.days = [...alarm.days, id];
      }
      newAlarms[index] = alarm;
      return newAlarms;
    });
  };

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

  const deleteAlarm = async (id: string) => {
    try {
      await deleteAlarmFromDatabase(id);
      setAlarms((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Error al eliminar la alarma:", error);
      showNotification("error", "Error al eliminar la alarma");
    }
  };

  const renderSkeletonLoader = () => (
    <div className="paseos-container-skeleton">
      <div className="skeleton-title"></div>
      <div className="skeleton-days-container">
        {Array(7)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="skeleton-day-button"></div>
          ))}
      </div>
      <div className="skeleton-time-picker"></div>
      <div className="skeleton-schedule-button"></div>
    </div>
  );

  return (
    <div className="paseos-section">
      {/* Notificaciones visuales usando AlertMessage */}
      {notifications.map((notification) => (
        <AlertMessage
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => closeNotification(notification.id)}
        />
      ))}
      {showSkeleton ? (
        renderSkeletonLoader()
      ) : (
        <>
          <h2 className="paseos-title">Programar Actividades</h2>
          <div className="paseos-container">
            {alarms.map((alarm, idx) => (
              <div key={alarm.id} className="paseos-alarm-card minimal">
                <button
                  className="delete-alarm-btn"
                  aria-label="Eliminar alarma"
                  title="Eliminar alarma"
                  onClick={() => deleteAlarm(alarm.id)}
                  type="button"
                >
                  <FaTimes />
                </button>
                <input
                  type="text"
                  placeholder="Nombre de tu mascota"
                  value={alarm.name}
                  onChange={(e) =>
                    handleAlarmChange(idx, "name", e.target.value)
                  }
                  className="paseos-alarm-name"
                />
                <div className="days-container">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.id}
                      className={`day-button ${
                        alarm.days.includes(day.id) ? "selected" : ""
                      }`}
                      onClick={() => toggleDay(idx, day.id)}
                    >
                      {day.id}
                    </button>
                  ))}
                </div>
                <div className="paseos-time-display-wrapper">
                  <div
                    className="paseos-time-display"
                    onClick={() => {
                      const input = document.getElementById(
                        `paseos-time-input-${alarm.id}`
                      );
                      if (input) (input as HTMLElement).click();
                    }}
                    tabIndex={0}
                    role="button"
                    title="Cambiar hora"
                  >
                    <span className="paseos-time-hour">
                      {alarm.time ? alarm.time.format("h:mm") : "--:--"}
                    </span>
                    <span className="paseos-time-ampm">
                      {alarm.time ? alarm.time.format("A") : ""}
                    </span>
                  </div>
                  <TimePicker
                    id={`paseos-time-input-${alarm.id}`}
                    use12Hours
                    format="h:mm A"
                    value={alarm.time}
                    onChange={(time) => handleAlarmChange(idx, "time", time)}
                    inputReadOnly
                    style={{
                      opacity: 0,
                      width: 0,
                      height: 0,
                      pointerEvents: "none",
                      position: "absolute",
                    }}
                    popupClassName="paseos-time-popup"
                  />
                </div>
                <div className="paseos-switch-container">
                  <label className="paseos-switch">
                    <input
                      type="checkbox"
                      checked={alarm.active}
                      onChange={(e) =>
                        handleActiveChange(idx, e.target.checked)
                      }
                    />
                    <span className="paseos-slider"></span>
                  </label>
                  <span className="paseos-switch-label">
                    {alarm.active ? "Activada" : "Desactivada"}
                  </span>
                </div>
                <div className="paseos-button-group">
                  <button
                    className="save-button"
                    onClick={() => schedulePaseo(idx)}
                  >
                    Programar Actividad
                  </button>
                  <button
                    className="test-button"
                    onClick={() => testAlarm(idx)}
                    title="Probar alarma ahora"
                  >
                    Probar
                  </button>
                </div>
              </div>
            ))}
            <button className="add-alarm-btn" onClick={addAlarm}>
              <FaPlus />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Paseos;
