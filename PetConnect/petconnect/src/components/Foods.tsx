import React, { useState, useEffect } from "react";
import { TimePicker } from "antd";
import dayjs from "dayjs";
import { FaCheck, FaTimes, FaPlus } from "react-icons/fa";
import "../styles/foods.css";
import "../styles/style.css";

const daysOfWeek = [
  { id: "L", label: "Lunes" },
  { id: "M", label: "Martes" },
  { id: "X", label: "Miércoles" },
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
}

const Foods: React.FC = () => {
  const [alarms, setAlarms] = useState<FoodAlarm[]>([
    {
      id: Date.now().toString(),
      name: "",
      days: [],
      time: dayjs().hour(21).minute(0),
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
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  const showNotification = (
    type: "success" | "error" | "warning",
    message: string
  ) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const closeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleAlarmChange = (
    index: number,
    field: keyof FoodAlarm,
    value: any
  ) => {
    setAlarms((prev) => {
      const updated = [...prev];
      if (field === "days") {
        updated[index].days = value;
      } else {
        updated[index][field] = value;
      }
      return updated;
    });
  };

  const toggleDay = (index: number, id: string) => {
    setAlarms((prev) => {
      const updated = [...prev];
      const alarm = updated[index];
      alarm.days = alarm.days.includes(id)
        ? alarm.days.filter((d) => d !== id)
        : [...alarm.days, id];
      return updated;
    });
  };

  const addAlarm = () => {
    setAlarms((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        days: [],
        time: dayjs().hour(21).minute(0),
      },
    ]);
  };

  const scheduleFood = (index: number) => {
    const alarm = alarms[index];
    if (alarm.days.length === 0 || !alarm.time || !alarm.name.trim()) {
      showNotification(
        "warning",
        "Completa el nombre, días y hora para la alarma"
      );
      return;
    }
    localStorage.setItem(
      `foodSchedule_${alarm.id}`,
      JSON.stringify({
        name: alarm.name,
        days: alarm.days,
        time: alarm.time.format("HH:mm"),
      })
    );
    showNotification(
      "success",
      `Comida "${alarm.name}" programada para ${alarm.days.join(
        ", "
      )} a las ${alarm.time.format("h:mm A")}`
    );
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Comida Programada", {
        body: `Comida "${alarm.name}" programada para ${alarm.days.join(
          ", "
        )} a las ${alarm.time.format("HH:mm")}`,
        icon: "/images/Logo_gradient.png",
      });
    }
  };

  return (
    <div className="foods-section">
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
        <div className="foods-container-skeleton">
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
        <>
          <h2 className="foods-title">Comidas</h2>
          {alarms.map((alarm, idx) => (
            <div key={alarm.id} className="foods-alarm-card minimal">
              <button
                className="delete-alarm-btn"
                aria-label="Eliminar alarma"
                title="Eliminar alarma"
                onClick={() => {
                  setAlarms((prev) => prev.filter((a) => a.id !== alarm.id));
                }}
                type="button"
              >
                <FaTimes />
              </button>
              <input
                className="foods-alarm-name"
                type="text"
                placeholder="Nombre de la alarma"
                value={alarm.name}
                onChange={(e) => handleAlarmChange(idx, "name", e.target.value)}
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
                    {day.label.charAt(0)}
                  </button>
                ))}
              </div>
              <div className="foods-time-display-wrapper">
                <div
                  className="foods-time-display"
                  onClick={() => {
                    const input = document.getElementById(
                      `foods-time-input-${alarm.id}`
                    );
                    if (input) (input as HTMLElement).click();
                  }}
                  tabIndex={0}
                  role="button"
                  title="Cambiar hora"
                >
                  <span className="foods-time-hour">
                    {alarm.time ? alarm.time.format("h:mm") : "--:--"}
                  </span>
                  <span className="foods-time-ampm">
                    {alarm.time ? alarm.time.format("A") : ""}
                  </span>
                </div>
                <TimePicker
                  id={`foods-time-input-${alarm.id}`}
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
                  popupClassName="foods-time-popup"
                />
              </div>
              <button className="save-button" onClick={() => scheduleFood(idx)}>
                Programar Comida
              </button>
            </div>
          ))}
          <button
            className="add-alarm-btn"
            onClick={addAlarm}
            title="Agregar alarma"
          >
            <FaPlus />
          </button>
        </>
      )}
    </div>
  );
};

export default Foods;
