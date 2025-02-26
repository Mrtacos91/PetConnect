import React, { useState, useEffect } from "react";

interface Activity {
    id: number;
    name: string;
    date: string;
    completed: boolean;
}

const Actividades: React.FC = () => {
    const [activities, setActivities] = useState<Activity[]>([
        { id: 1, name: "Cita veterinaria", date: "2025-02-26 10:00 AM", completed: false },
        { id: 2, name: "Paseo con Fido", date: "2025-02-27 6:30 PM", completed: false },
    ]);

    const [newActivity, setNewActivity] = useState("");

    // ✅ Marcar actividad como completada
    const toggleComplete = (id: number) => {
        setActivities(activities.map(activity =>
            activity.id === id ? { ...activity, completed: !activity.completed } : activity
        ));
    };

    // ✅ Agregar nueva actividad con validación
    const addActivity = () => {
        if (newActivity.trim() === "") return;

        const newId = activities.length > 0 ? Math.max(...activities.map(a => a.id)) + 1 : 1;
        setActivities([...activities, { id: newId, name: newActivity, date: "Sin fecha", completed: false }]);
        setNewActivity(""); // Limpiar input
    };

    // ✅ Eliminar actividad
    const deleteActivity = (id: number) => {
        setActivities(activities.filter(activity => activity.id !== id));
    };

    // ✅ Notificaciones antes de la actividad (con permisos)
    useEffect(() => {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        const checkNotifications = () => {
            const now = new Date();
            activities.forEach(activity => {
                const activityTime = new Date(activity.date || new Date()); // Evita errores con "Sin fecha"
                const diff = activityTime.getTime() - now.getTime();

                if (diff > 0 && diff < 60000) { // 1 minuto antes
                    new Notification("Recordatorio de Actividad", {
                        body: `¡${activity.name} está por comenzar!`,
                        icon: "/images/notification-icon.png",
                    });
                }
            });
        };

        const interval = setInterval(checkNotifications, 30000); // Verifica cada 30 seg
        return () => clearInterval(interval); // Limpia el intervalo cuando se desmonta
    }, [activities]);

    return (
        <div className="activities-card">
            <h2>Actividades</h2>

            {/* Input para agregar nueva actividad */}
            <div className="input-group">
                <input
                    type="text"
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    placeholder="Nueva actividad (Ej. Visita al veterinario)"
                />
                <button onClick={addActivity} disabled={newActivity.trim() === ""}>
                    Agregar
                </button>
            </div>

            {/* Lista de actividades */}
            <ul className="activity-list">
                {activities.map(activity => (
                    <li key={activity.id} className={activity.completed ? "completed" : ""}>
                        <span>{activity.name} - {activity.date}</span>
                        <button onClick={() => toggleComplete(activity.id)}>
                            {activity.completed ? "Desmarcar" : "Completar"}
                        </button>
                        <button onClick={() => deleteActivity(activity.id)}>❌</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Actividades;
