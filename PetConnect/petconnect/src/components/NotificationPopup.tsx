import React from "react";
import "../styles/style.css";

export interface NotificationPopupProps {
  notifications: Array<{
    id: string;
    type: "success" | "error" | "warning";
    message: string;
  }>;
  onClose: (id: string) => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({
  notifications,
  onClose,
}) => {
  return (
    <div
      className="notification-popup-container"
      style={{ position: "fixed", top: 20, right: 20, zIndex: 9999 }}
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification-item ${notification.type}`}
          style={{ marginBottom: 8 }}
        >
          <span>{notification.message}</span>
          <button
            className="notification-close"
            onClick={() => onClose(notification.id)}
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationPopup;
