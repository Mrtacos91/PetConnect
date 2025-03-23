import React, { useState, useEffect } from "react";
import { TimePicker } from "antd";
import dayjs from "dayjs";
import "../styles/Paseos.css";

interface DayButton {
  id: string;
  label: string;
  selected: boolean;
}

const Paseos: React.FC = () => {
  const [selectedTime, setSelectedTime] = useState<dayjs.Dayjs | null>(null);
  const [days, setDays] = useState<DayButton[]>([
    { id: "L", label: "L", selected: false },
    { id: "M", label: "M", selected: false },
    { id: "M2", label: "M", selected: false },
    { id: "J", label: "J", selected: false },
    { id: "V", label: "V", selected: false },
    { id: "S", label: "S", selected: false },
    { id: "D", label: "D", selected: false },
  ]);

  useEffect(() => {
    // Request notification permission when component mounts
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

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
      alert("Por favor selecciona al menos un día y una hora");
      return;
    }

    if ("Notification" in window && Notification.permission === "granted") {
      // Save schedule to local storage
      const schedule = {
        days: selectedDays.map((day) => day.id),
        time: selectedTime.format("HH:mm"),
      };
      localStorage.setItem("walkSchedule", JSON.stringify(schedule));

      // Show confirmation notification
      new Notification("Paseo Programado", {
        body: `Tu paseo ha sido programado para los días ${selectedDays
          .map((d) => d.label)
          .join(", ")} a las ${selectedTime.format("HH:mm")}`,
        icon: "/path-to-your-icon.png",
      });
    }
  };

  return (
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
        <TimePicker
          use12Hours
          format="h:mm A"
          value={selectedTime}
          onChange={handleTimeChange}
          className="time-picker"
        />
      </div>
      <button className="save-button" onClick={scheduleNotification}>
        Guardar
      </button>
    </div>
  );
};

export default Paseos;
