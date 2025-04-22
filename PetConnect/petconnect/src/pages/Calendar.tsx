import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Calendar.css";
import { FaArrowLeft, FaArrowRight, FaArrowCircleLeft } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";
import MenuButton from "../components/MenuButton";

interface Event {
  id: string;
  date: Date;
  title: string;
  description: string;
}

const Calendar: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<
    Array<{ id: string; type: string; message: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Cargar eventos del localStorage
    const savedEvents = localStorage.getItem("petConnectEvents");
    if (savedEvents) {
      const parsedEvents = JSON.parse(savedEvents).map((event: any) => ({
        ...event,
        date: new Date(event.date),
      }));
      setEvents(parsedEvents);
    }
  }, []);

  useEffect(() => {
    // Guardar eventos en localStorage
    if (events.length > 0) {
      localStorage.setItem("petConnectEvents", JSON.stringify(events));
    }
  }, [events]);

  const showNotification = (type: string, message: string) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
    }, 5000);
  };

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
      const newDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      setSelectedDate(newDate);

      // Buscar eventos para esta fecha
      const eventsForDay = events.filter(
        (event) =>
          event.date.getDate() === day &&
          event.date.getMonth() === currentMonth.getMonth() &&
          event.date.getFullYear() === currentMonth.getFullYear()
      );

      if (eventsForDay.length > 0) {
        // Si hay eventos, mostrar el primero
        setEventTitle(eventsForDay[0].title);
        setEventDescription(eventsForDay[0].description);
        setCurrentEventId(eventsForDay[0].id);
        setIsEditing(true);
      } else {
        // Si no hay eventos, limpiar el formulario
        setEventTitle("");
        setEventDescription("");
        setCurrentEventId(null);
        setIsEditing(false);
      }
    }
  };

  const handleAddEvent = () => {
    setShowEventForm(true);
    setIsEditing(false);
    setEventTitle("");
    setEventDescription("");
    setCurrentEventId(null);
  };

  const handleEditEvent = () => {
    if (!selectedDate) {
      showNotification("error", "Por favor selecciona una fecha primero");
      return;
    }

    const eventsForDay = events.filter(
      (event) =>
        event.date.getDate() === selectedDate.getDate() &&
        event.date.getMonth() === selectedDate.getMonth() &&
        event.date.getFullYear() === selectedDate.getFullYear()
    );

    if (eventsForDay.length === 0) {
      showNotification("error", "No hay eventos para editar en esta fecha");
      return;
    }

    setEventTitle(eventsForDay[0].title);
    setEventDescription(eventsForDay[0].description);
    setCurrentEventId(eventsForDay[0].id);
    setIsEditing(true);
    setShowEventForm(true);
  };

  const handleDeleteEvent = () => {
    if (!selectedDate) {
      showNotification("error", "Por favor selecciona una fecha primero");
      return;
    }

    const updatedEvents = events.filter(
      (event) =>
        !(
          event.date.getDate() === selectedDate.getDate() &&
          event.date.getMonth() === selectedDate.getMonth() &&
          event.date.getFullYear() === selectedDate.getFullYear()
        )
    );

    if (updatedEvents.length === events.length) {
      showNotification("error", "No hay eventos para eliminar en esta fecha");
      return;
    }

    setEvents(updatedEvents);
    setSelectedDate(null);
    setEventTitle("");
    setEventDescription("");
    setCurrentEventId(null);
    showNotification("success", "Evento eliminado correctamente");
  };

  const handleSaveEvent = () => {
    if (!selectedDate || !eventTitle.trim()) {
      showNotification("error", "Por favor completa todos los campos");
      return;
    }

    if (isEditing && currentEventId) {
      // Actualizar evento existente
      const updatedEvents = events.map((event) =>
        event.id === currentEventId
          ? { ...event, title: eventTitle, description: eventDescription }
          : event
      );
      setEvents(updatedEvents);
      showNotification("success", "Evento actualizado correctamente");
    } else {
      // Crear nuevo evento
      const newEvent: Event = {
        id: Date.now().toString(),
        date: selectedDate,
        title: eventTitle,
        description: eventDescription,
      };
      setEvents([...events, newEvent]);
      showNotification("success", "Evento creado correctamente");
    }

    setShowEventForm(false);
    setEventTitle("");
    setEventDescription("");
    setCurrentEventId(null);
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
        <div
          key={`prev-${day}`}
          className="calendar-day prev-month"
          onClick={() => {}}
        >
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
        selectedDate && selectedDate.toDateString() === date.toDateString();

      // Verificar si hay eventos para este día
      const hasEvent = events.some(
        (event) =>
          event.date.getDate() === day &&
          event.date.getMonth() === currentMonth.getMonth() &&
          event.date.getFullYear() === currentMonth.getFullYear()
      );

      days.push(
        <div
          key={`current-${day}`}
          className={`calendar-day current-month ${isToday ? "today" : ""} ${
            isSelected ? "selected" : ""
          } ${hasEvent ? "has-event" : ""}`}
          onClick={() => handleDateClick(day, true)}
        >
          {day}
        </div>
      );
    }

    // Días del mes siguiente
    const totalDaysDisplayed = days.length;
    const daysNeeded = 42 - totalDaysDisplayed; // 6 filas x 7 días = 42

    for (let day = 1; day <= daysNeeded; day++) {
      days.push(
        <div
          key={`next-${day}`}
          className="calendar-day next-month"
          onClick={() => {}}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="calendar-container">
      <Sidebar isOpen={isSidebarOpen} />
      <ThemeToggle />
      <MenuButton isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
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

      <div className="back-button-container">
        {isLoading ? (
          <div className="skeleton-button"></div>
        ) : (
          <button
            className="calendar-back-button"
            onClick={() => navigate("/dashboard")}
          >
            <span>
              <FaArrowCircleLeft /> Volver
            </span>
          </button>
        )}
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
                {monthNames[currentMonth.getMonth()]}
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
          {/* Días de la semana */}
          {dayNames.map((day) => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}

          {/* Días del mes */}
          {renderCalendarDays()}
        </div>
      )}

      <div className="calendar-actions">
        {isLoading ? (
          <>
            <div className="skeleton-button"></div>
            <div className="skeleton-button"></div>
            <div className="skeleton-button"></div>
          </>
        ) : (
          <>
            <button
              className="calendar-button add-button"
              onClick={handleAddEvent}
            >
              <span>Agregar</span>
            </button>
            <button
              className="calendar-button edit-button"
              onClick={handleEditEvent}
            >
              <span>Editar</span>
            </button>
            <button
              className="calendar-button delete-button"
              onClick={handleDeleteEvent}
            >
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
            <div className="form-actions">
              <button
                className="calendar-button save-button-cl"
                onClick={handleSaveEvent}
              >
                <span>Guardar</span>
              </button>
              <button
                className="calendar-button cancel-button"
                onClick={() => setShowEventForm(false)}
              >
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
