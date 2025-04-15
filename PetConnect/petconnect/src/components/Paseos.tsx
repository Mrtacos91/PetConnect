import React, { useState, useEffect } from "react";
import { TimePicker } from "antd";
import dayjs from "dayjs";
import { FaCheck, FaTimes } from "react-icons/fa";
import "../styles/Paseos.css";
import "../styles/style.css"; // Importamos los estilos de notificación

interface DayButton {
  id: string;
  label: string;
  selected: boolean;
}

const Paseos: React.FC = () => {
  const [selectedTime, setSelectedTime] = useState<dayjs.Dayjs | null>(
    dayjs().hour(21).minute(0) // Default to 9:00 PM
  );
  const [days, setDays] = useState<DayButton[]>([
    { id: "L", label: "L", selected: false },
    { id: "M", label: "M", selected: false },
    { id: "M2", label: "M", selected: false },
    { id: "J", label: "J", selected: false },
    { id: "V", label: "V", selected: false },
    { id: "S", label: "S", selected: false },
    { id: "D", label: "D", selected: false },
  ]);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "error";
      message: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    // Registrar el tiempo de inicio para asegurar un mínimo de 2 segundos
    const startTime = Date.now();

    // Simulate loading data
    const loadData = async () => {
      // Simular carga de datos
      await new Promise((resolve) => setTimeout(resolve, 500));

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

    return () => {};
  }, []);

  useEffect(() => {
    // Request notification permission when component mounts
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // Función para mostrar notificaciones
  const showNotification = (type: "success" | "error", message: string) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);

    // Eliminar la notificación después de 5 segundos
    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
    }, 5000);
  };

  // Función para cerrar una notificación específica
  const closeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const toggleDay = (id: string) => {
    setDays(
      days.map((day) =>
        day.id === id ? { ...day, selected: !day.selected } : day
      )
    );
  };

  const handleTimeChange = (time: dayjs.Dayjs | null) => {
    setSelectedTime(time);
  };

  const scheduleNotification = () => {
    const selectedDays = days.filter((day) => day.selected);
    if (selectedDays.length === 0 || !selectedTime) {
      showNotification(
        "error",
        "Por favor selecciona al menos un día y una hora"
      );
      return;
    }

    // Save schedule to local storage
    const schedule = {
      days: selectedDays.map((day) => day.id),
      time: selectedTime.format("HH:mm"),
    };
    localStorage.setItem("walkSchedule", JSON.stringify(schedule));

    // Mostrar notificación de éxito
    showNotification(
      "success",
      `Tu paseo ha sido programado para los días ${selectedDays
        .map((d) => d.label)
        .join(", ")} a las ${selectedTime.format("h:mm A")}`
    );

    // Show browser notification if permission granted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Paseo Programado", {
        body: `Tu paseo ha sido programado para los días ${selectedDays
          .map((d) => d.label)
          .join(", ")} a las ${selectedTime.format("HH:mm")}`,
        icon: "/path-to-your-icon.png",
      });
    }
  };

  // Format time for display
  const formattedTime = selectedTime ? selectedTime.format("h:mm") : "";
  const amPm = selectedTime ? selectedTime.format("A") : "";

  return (
    <div className="paseos-section">
      {/* Contenedor de notificaciones */}
      <div className="notification-container">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-item ${notification.type}`}
          >
            <div className="notification-content">
              <div className="notification-icon">
                {notification.type === "success" ? <FaCheck /> : <FaTimes />}
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
        <div className="paseos-container-skeleton">
          <div className="skeleton-title"></div>
          <div className="skeleton-days-container">
            {Array(7)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="skeleton-day-button"></div>
              ))}
          </div>
          <div className="skeleton-time-picker"></div>
          <div className="skeleton-schedule-button"></div>
        </div>
      ) : (
        <div className="paseos-container">
          <h2 className="paseos-title">Paseo personalizado</h2>
          <div className="days-container">
            {days.map((day) => (
              <button
                key={day.id}
                className={`day-button ${day.selected ? "selected" : ""}`}
                onClick={() => toggleDay(day.id)}
              >
                {day.label}
              </button>
            ))}
          </div>
          <div className="time-container">
            <span>{formattedTime}</span>
            <span style={{ marginLeft: "5px", fontSize: "0.7em" }}>{amPm}</span>
            <TimePicker
              use12Hours
              format="h:mm A"
              value={selectedTime}
              onChange={handleTimeChange}
              className="time-picker"
              popupStyle={{ zIndex: 1000 }}
              style={{
                opacity: 0,
                position: "absolute",
                width: "100%",
                height: "100%",
                top: 0,
                left: 0,
              }}
            />
          </div>
          <button className="save-button" onClick={scheduleNotification}>
            Guardar
          </button>
        </div>
      )}
    </div>
  );
};

export default Paseos;
