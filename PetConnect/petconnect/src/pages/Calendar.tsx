import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Calendar.css";
import {
  FaArrowLeft,
  FaArrowRight,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import BackButton from "../components/BackButton";
import supabase from "../supabase";

interface Event {
  id: number;
  date: string | Date;
  title: string;
  description: string;
  user_id: number;
  created_at?: string;
}

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<
    Array<{ id: string; type: string; message: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  const monthNames = [
    "ENERO",
    "FEBRERO",
    "MARZO",
    "ABRIL",
    "MAYO",
    "JUNIO",
    "JULIO",
    "AGOSTO",
    "SEPTIEMBRE",
    "OCTUBRE",
    "NOVIEMBRE",
    "DICIEMBRE",
  ];

  const dayNames = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

  const showNotification = (type: string, message: string) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
    }, 5000);
  };

  const checkUser = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.error("Error de sesión:", error);
        navigate("/login");
        return null;
      }

      const { data: localUser, error: localError } = await supabase
        .from("Users")
        .select("id")
        .eq("email", user.email)
        .single();

      if (localError || !localUser) {
        console.error("Error al obtener usuario local:", localError);
        showNotification("error", "No se encontró tu usuario local");
        return null;
      }

      setUserId(localUser.id);
      return localUser.id;
    } catch (error) {
      console.error("Error en checkUser:", error);
      showNotification("error", "Error al verificar usuario");
      return null;
    }
  };

  const fetchEvents = async (user_id: number) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("calendar")
        .select("*")
        .eq("user_id", user_id)
        .order("date", { ascending: true });

      if (error) {
        throw error;
      }

      const parsedEvents = (data || []).map((event: any) => ({
        ...event,
        date: new Date(event.date),
      }));

      setEvents(parsedEvents);
    } catch (error) {
      console.error("Error en fetchEvents:", error);
      showNotification("error", "Error al cargar eventos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      const user_id = await checkUser();
      if (user_id !== null) {
        await fetchEvents(user_id);
      }
    };

    initializeData();
  }, [navigate]);

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getLastDayOfPrevMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 0).getDate();
  };

  const handleDateClick = (day: number, isCurrentMonth: boolean) => {
    if (isCurrentMonth) {
      // Crear la fecha en hora local sin problemas de zona horaria
      const newDate = new Date(
        Date.UTC(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          day,
          12, // Hora fija (mediodía) para evitar problemas
          0,
          0,
          0
        )
      );

      setSelectedDate(newDate);

      const eventForDay = events.find((event) => {
        const eventDate =
          typeof event.date === "string" ? new Date(event.date) : event.date;
        const utcEventDate = new Date(
          Date.UTC(
            eventDate.getFullYear(),
            eventDate.getMonth(),
            eventDate.getDate(),
            12,
            0,
            0,
            0
          )
        );

        return (
          utcEventDate.getDate() === newDate.getDate() &&
          utcEventDate.getMonth() === newDate.getMonth() &&
          utcEventDate.getFullYear() === newDate.getFullYear()
        );
      });

      if (eventForDay) {
        setEventTitle(eventForDay.title);
        setEventDescription(eventForDay.description);
        setCurrentEventId(eventForDay.id);
        setIsEditing(true);
      } else {
        resetForm();
      }
    }
  };

  const handleAddEvent = () => {
    if (!selectedDate) {
      showNotification("error", "Por favor selecciona una fecha primero");
      return;
    }
    setShowEventForm(true);
    setIsEditing(false);
    resetForm();
  };

  const handleEditEvent = () => {
    if (!selectedDate || !currentEventId) {
      showNotification("error", "Por favor selecciona un evento primero");
      return;
    }

    setShowEventForm(true);
  };

  const handleDeleteEvent = async () => {
    if (!currentEventId) {
      showNotification("error", "Por favor selecciona un evento primero");
      return;
    }

    try {
      const { error } = await supabase
        .from("calendar")
        .delete()
        .eq("id", currentEventId);

      if (error) throw error;

      setEvents(events.filter((event) => event.id !== currentEventId));
      setSelectedDate(null);
      setCurrentEventId(null);
      setEventTitle("");
      setEventDescription("");
      setIsEditing(false);

      showNotification("success", "Evento eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar evento:", error);
      showNotification("error", "Error al eliminar el evento");
    }
  };

  const handleSaveEvent = async () => {
    if (!selectedDate || !eventTitle.trim() || userId === null) {
      showNotification("error", "Por favor completa todos los campos");
      return;
    }

    try {
      // Crear fecha UTC para evitar problemas de zona horaria
      const utcDate = new Date(
        Date.UTC(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          12,
          0,
          0,
          0
        )
      );

      const eventData = {
        title: eventTitle,
        description: eventDescription,
        date: utcDate.toISOString(),
        user_id: userId,
      };

      if (isEditing && currentEventId) {
        const { error } = await supabase
          .from("calendar")
          .update(eventData)
          .eq("id", currentEventId);

        if (error) throw error;

        setEvents(
          events.map((event) =>
            event.id === currentEventId
              ? {
                  ...event,
                  ...eventData,
                  date: utcDate,
                }
              : event
          )
        );
      } else {
        const { data, error } = await supabase
          .from("calendar")
          .insert(eventData)
          .select();

        if (error) throw error;

        if (data?.[0]) {
          setEvents([
            ...events,
            {
              ...data[0],
              date: new Date(data[0].date),
            },
          ]);
        }
      }

      showNotification(
        "success",
        `Evento ${isEditing ? "actualizado" : "creado"} correctamente`
      );
      setShowEventForm(false);
      resetForm();
    } catch (error) {
      console.error("Error en handleSaveEvent:", error);
      showNotification(
        "error",
        `Error al ${isEditing ? "actualizar" : "crear"} evento`
      );
    }
  };

  const resetForm = () => {
    setEventTitle("");
    setEventDescription("");
    setCurrentEventId(null);
    setIsEditing(false);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    const lastDayOfPrevMonth = getLastDayOfPrevMonth(currentMonth);

    const days = [];

    // Días del mes anterior
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = lastDayOfPrevMonth - i;
      days.push(
        <div key={`prev-${day}`} className="calendar-day prev-month">
          {day}
        </div>
      );
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected =
        selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth.getMonth() &&
        selectedDate.getFullYear() === currentMonth.getFullYear();

      const hasEvent = events.some((event) => {
        const eventDate =
          typeof event.date === "string" ? new Date(event.date) : event.date;
        return (
          eventDate.getDate() === day &&
          eventDate.getMonth() === currentMonth.getMonth() &&
          eventDate.getFullYear() === currentMonth.getFullYear()
        );
      });

      days.push(
        <div
          key={`current-${day}`}
          className={`calendar-day current-month ${isToday ? "today" : ""} ${
            isSelected ? "selected" : ""
          } ${hasEvent ? "has-event" : ""}`}
          onClick={() => handleDateClick(day, true)}
        >
          {day}
          {hasEvent && <div className="event-dot"></div>}
        </div>
      );
    }

    // Días del mes siguiente
    const totalDaysDisplayed = days.length;
    const daysNeeded = 42 - totalDaysDisplayed;

    for (let day = 1; day <= daysNeeded; day++) {
      days.push(
        <div key={`next-${day}`} className="calendar-day next-month">
          {day}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="calendar-container">
      <BackButton route="/dashboard" />
      <div className="notification-container">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-item ${notification.type}`}
          >
            <div className="notification-content">
              <div className="notification-text">{notification.message}</div>
            </div>
            <div className="notification-progress-bar"></div>
          </div>
        ))}
      </div>

      <h1 className="calendar-title">
        {isLoading ? <div className="skeleton-title"></div> : "CALENDARIO"}
      </h1>

      <div className="calendar-header">
        <div className="month-navigation">
          {isLoading ? (
            <>
              <div className="skeleton-nav-button"></div>
              <div className="skeleton-month"></div>
              <div className="skeleton-nav-button"></div>
            </>
          ) : (
            <>
              <button className="month-nav-button" onClick={prevMonth}>
                <FaArrowLeft />
              </button>
              <h2 className="current-month">
                {monthNames[currentMonth.getMonth()]}{" "}
                {currentMonth.getFullYear()}
              </h2>
              <button className="month-nav-button" onClick={nextMonth}>
                <FaArrowRight />
              </button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="skeleton-calendar-grid">
          {Array(35)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="skeleton-day"></div>
            ))}
        </div>
      ) : (
        <div className="calendar-grid">
          {dayNames.map((day) => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
          {renderCalendarDays()}
        </div>
      )}

      <div className="calendar-actions">
        {isLoading ? (
          <>
            <div className="skeleton-button"></div>
            <div className="skeleton-button"></div>
          </>
        ) : (
          <>
            <button
              className="calendar-action-button add-button"
              onClick={handleAddEvent}
            >
              <FaPlus className="button-icon" />
              <span>Agregar</span>
            </button>
            <button
              className="calendar-action-button edit-button"
              onClick={handleEditEvent}
              disabled={!selectedDate}
            >
              <FaEdit className="button-icon" />
              <span>Editar</span>
            </button>
            <button
              className="calendar-action-button delete-button-calendar"
              onClick={handleDeleteEvent}
              disabled={!selectedDate}
            >
              <FaTrash className="button-icon" />
              <span>Eliminar</span>
            </button>
          </>
        )}
      </div>

      {showEventForm && (
        <div className="event-form-overlay">
          <div className="event-form">
            <h3>{isEditing ? "Editar Evento" : "Nuevo Evento"}</h3>
            <div className="form-group">
              <label>Título:</label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Título del evento"
              />
            </div>
            <div className="form-group">
              <label>Descripción:</label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Descripción del evento"
              />
            </div>
            <div className="form-group">
              <label>Fecha seleccionada:</label>
              <div className="selected-date">
                {selectedDate?.toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
            <div className="form-actions">
              <button
                className="calendar-form-button save-button"
                onClick={handleSaveEvent}
              >
                <FaSave className="button-icon" />
                <span>Guardar</span>
              </button>
              <button
                className="calendar-form-button cancel-button"
                onClick={() => setShowEventForm(false)}
              >
                <FaTimes className="button-icon" />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
