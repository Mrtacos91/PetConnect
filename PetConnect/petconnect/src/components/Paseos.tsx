import React, { useState, useEffect, useCallback } from "react";
import { onMessage } from "firebase/messaging";
import {
  VAPID_KEY,
  messaging,
  getOrCreateFCMToken,
  sendPushNotificationToServer,
} from "../../firebase";
import { TimePicker } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { FaPlus, FaCheck, FaTimes } from "react-icons/fa";
import "../styles/Paseos.css";
import "../styles/style.css";
import supabase from "../supabase";
import { useNavigate } from "react-router-dom";

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

// Token de FCM para uso en la aplicación
let fcmToken: string | null = null;

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
  const [, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [, setNotificationsEnabled] = useState<boolean>(false);
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
      setIsLoading(true);
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
      setIsLoading(false);
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

  const setupNotifications = useCallback(async () => {
    try {
      // 1. Verificar si estamos en un entorno móvil
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      console.log("Configurando notificaciones...");
      console.log(`Dispositivo: ${isMobile ? "Móvil" : "Escritorio"}`);

      // 2. Verificar soporte para notificaciones
      if (!("Notification" in window)) {
        console.log("Este navegador no soporta notificaciones");
        return false;
      }

      // 3. Registrar Service Worker con manejo específico para móviles
      try {
        let swRegistration;
        if (isMobile) {
          // En móviles, intentar registrar el SW con scope específico
          swRegistration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js",
            { scope: "/" }
          );
        } else {
          swRegistration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js"
          );
        }

        console.log("Service Worker registrado con éxito:", swRegistration);

        // Esperar a que el Service Worker esté activo
        if (swRegistration.installing || swRegistration.waiting) {
          await new Promise<void>((resolve) => {
            const worker = swRegistration.installing || swRegistration.waiting;
            if (worker) {
              worker.addEventListener("statechange", () => {
                if (worker.state === "activated") {
                  console.log("Service Worker completamente activado");
                  resolve();
                }
              });
            } else {
              resolve();
            }
          });
        }

        // 4. Solicitar permiso de notificación con manejo específico para móviles
        let permission = Notification.permission;
        if (permission !== "granted" && permission !== "denied") {
          // En móviles, mostrar un mensaje explicativo antes de solicitar permisos
          if (isMobile) {
            showNotification(
              "warning",
              "Para recibir notificaciones, por favor acepta los permisos cuando el navegador los solicite"
            );
          }
          permission = await Notification.requestPermission();
        }

        if (permission !== "granted") {
          console.log("No se ha concedido permiso para notificaciones");
          if (isMobile) {
            showNotification(
              "warning",
              "Las notificaciones están desactivadas. Para activarlas, ve a la configuración de tu navegador"
            );
          }
          return false;
        }

        // 5. Obtener token FCM con manejo específico para móviles
        console.log("Solicitando token FCM...");
        const token = await getOrCreateFCMToken(VAPID_KEY);

        if (token) {
          console.log(
            "Token FCM obtenido correctamente:",
            token.substring(0, 10) + "..."
          );
          fcmToken = token;
          setNotificationsEnabled(true);
          return true;
        } else {
          console.warn("No se pudo obtener el token FCM");
          if (isMobile) {
            showNotification(
              "warning",
              "No se pudo configurar las notificaciones push. Intenta recargar la página"
            );
          }
          return false;
        }
      } catch (swError) {
        console.error("Error al registrar el Service Worker:", swError);
        if (isMobile) {
          showNotification(
            "error",
            "Error al configurar las notificaciones. Intenta usar un navegador diferente"
          );
        }
        return false;
      }
    } catch (error) {
      console.error("Error al configurar notificaciones:", error);
      return false;
    }
  }, [showNotification]);

  useEffect(() => {
    const initNotifications = async () => {
      // Intentar configurar notificaciones
      const enabled = await setupNotifications();

      // Si no se pudieron configurar, mostrar mensaje
      if (!enabled) {
        const permission = Notification.permission;
        if (permission === "denied") {
          showNotification(
            "warning",
            "Las notificaciones están bloqueadas. Actívalas en la configuración del navegador para recibir recordatorios de paseos."
          );
        } else {
          showNotification(
            "warning",
            "No pudimos configurar las notificaciones push. Las alarmas seguirán funcionando localmente."
          );
        }
      }
    };

    initNotifications();

    // Configurar listener para mensajes FCM
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("Mensaje recibido en primer plano:", payload);
        // Mostrar notificación en primer plano
        if (payload.notification) {
          const title = payload.notification.title || "PetConnect";
          const options = {
            body: payload.notification.body,
            icon: "/images/Logo_gradient.png",
          };

          if (Notification.permission === "granted") {
            new Notification(title, options);
          } else {
            showNotification(
              "warning",
              `${title}: ${payload.notification.body}`
            );
          }
        }
      });

      // Limpiar listener al desmontar
      return () => {
        unsubscribe();
      };
    }
  }, [setupNotifications, showNotification]);

  // Función para enviar un mensaje a través de Firebase Cloud Messaging
  const sendFirebaseCloudMessage = async (
    title: string,
    body: string,
    alarm: PaseoAlarm
  ) => {
    if (!fcmToken) {
      console.log("Intentando obtener token FCM...");
      const token = await getOrCreateFCMToken();
      if (!token) {
        console.error("No se pudo obtener un token FCM");
        showNotification(
          "error",
          "No se pudo enviar la notificación push: falta token FCM"
        );
        return false;
      }
      console.log("Token FCM obtenido correctamente");
      fcmToken = token;
    }

    try {
      const data = {
        alarmId: alarm.id,
        petName: alarm.name,
        clickAction: "/paseos",
        timestamp: new Date().toISOString(),
      };

      console.log(`Enviando notificación FCM para ${alarm.name}...`);

      // En desarrollo, simular el envío pero registrar en consola
      if (process.env.NODE_ENV === "production") {
        console.log("Enviando notificación push al servidor en producción");
        await sendPushNotificationToServer(fcmToken, title, body, data);
        console.log("Notificación push enviada al servidor correctamente");
      } else {
        console.log("Simulando envío de notificación push (modo desarrollo)");
        console.log("Datos que se enviarían:", {
          token: fcmToken.substring(0, 10) + "...",
          title,
          body,
          data,
        });
      }

      showNotification(
        "success",
        `Notificación push enviada para ${alarm.name}`
      );
      return true;
    } catch (error) {
      console.error("Error al enviar notificación push:", error);
      showNotification(
        "error",
        `Error al enviar notificación push: ${error instanceof Error ? error.message : "Error desconocido"
        }`
      );
      return false;
    }
  };

  // Función para enviar notificación push
  const sendPushNotification = useCallback(
    async (alarm: PaseoAlarm) => {
      if (!userId) {
        console.warn("No hay usuario autenticado para enviar notificaciones");
        return;
      }

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (Notification.permission !== "granted") {
        console.warn("No tenemos permiso para enviar notificaciones push");
        if (isMobile) {
          showNotification(
            "warning",
            "Las notificaciones están desactivadas. Actívalas en la configuración de tu navegador"
          );
        }
        return;
      }

      const title = `¡Hora de pasear a ${alarm.name}!`;
      const body = `Es momento del paseo programado para ${alarm.name}`;

      try {
        // Obtener el registro del Service Worker
        const registration = await navigator.serviceWorker.ready;

        // Opciones básicas de notificación
        const notificationOptions = {
          body,
          icon: "/images/Logo_gradient.png",
          badge: "/images/Logo_black.png",
          tag: `paseo-${alarm.id}-${Date.now()}`, // Añadir timestamp para evitar duplicados
          silent: false,
          vibrate: isMobile ? [200, 100, 200] : undefined,
          requireInteraction: true,
          data: {
            url: "/paseos", // URL a la que navegar cuando se hace clic en la notificación
            alarmId: alarm.id,
            timestamp: Date.now().toString(), // Añadir timestamp para identificar cada notificación
          },
        };

        // Mostrar la notificación a través del Service Worker
        await registration.showNotification(title, notificationOptions);

        // Si tenemos FCM token, intentar enviar notificación push
        if (fcmToken) {
          await sendFirebaseCloudMessage(title, body, alarm);
        } else {
          console.warn(
            "No hay token FCM disponible para enviar notificación push"
          );
        }

        console.log(`Notificación enviada para: ${alarm.name}`);

        // Actualizar la fecha de última notificación
        const now = dayjs().tz(TIMEZONE).format();

        // Actualizar estado local
        setAlarms((prev) =>
          prev.map((a) =>
            a.id === alarm.id ? { ...a, lastNotification: now } : a
          )
        );

        console.log(`Notificación enviada para ${alarm.name} a las ${now}`);
      } catch (error) {
        console.error("Error al enviar notificación:", error);
        if (isMobile) {
          showNotification(
            "error",
            "Error al enviar la notificación. Intenta recargar la página"
          );
        }
      }
    },
    [userId, showNotification, fcmToken]
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
      sendPushNotification(alarm);
    });
  }, [alarms, userId, sendPushNotification]);

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

    if (!userId) {
      showNotification(
        "error",
        "No hay usuario autenticado. Por favor, inicia sesión nuevamente."
      );
      return;
    }

    try {
      await sendPushNotification(alarm);
      showNotification(
        "success",
        `Prueba de alarma enviada para ${alarm.name}`
      );
    } catch (error) {
      console.error("Error al probar la alarma:", error);
      showNotification("error", "Error al enviar la notificación de prueba");
    }
  };

  // Modificar useEffect para cargar alarmas al inicio
  useEffect(() => {
    const initializeData = async () => {
      const user_id = await checkUser();
      if (user_id) {
        fetchAlarms(user_id);
      }
    };

    initializeData();
  }, [navigate]);

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
        setIsLoading(false);
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
      <div className="notification-container">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-item ${notification.type}`}
          >
            <div className="notification-content">
              <div className="notification-icon">
                {notification.type === "success" ? (
                  <FaCheck />
                ) : notification.type === "error" ? (
                  <FaTimes />
                ) : (
                  <FaPlus />
                )}
              </div>
              <div className="notification-text">{notification.message}</div>
            </div>
            <div
              className="notification-close"
              onClick={() => closeNotification(notification.id)}
            >
              <FaTimes />
            </div>
            <div className="notification-progress-bar"></div>
          </div>
        ))}
      </div>
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
                      className={`day-button ${alarm.days.includes(day.id) ? "selected" : ""
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
