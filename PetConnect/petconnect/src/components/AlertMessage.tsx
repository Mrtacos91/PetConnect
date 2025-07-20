import React, { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import "../styles/style.css";

interface AlertMessageProps {
  message: string;
  type: "success" | "error" | "warning";
  onClose?: () => void;
}

const AlertMessage: React.FC<AlertMessageProps> = ({
  message,
  type,
  onClose,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  if (!visible) return null;

  // Forzar estilo amarillo para warning
  const warningStyle = type === "warning"
    ? {
        background: "#fffbe6",
        color: "#333",
        border: "1.5px solid #ffe58f"
      }
    : {};

  return (
    <div className="notification-container">
      <div className={`notification-item ${type}`} style={warningStyle}>
        <div className="notification-content">
          <span className="notification-icon">
            {type === "success" ? (
              <FaCheckCircle />
            ) : type === "error" ? (
              <FaTimesCircle />
            ) : (
              <FaExclamationTriangle />
            )}
          </span>
          <span className="notification-text">{message}</span>
        </div>
        <div className="notification-close" onClick={handleClose}>
          <FaTimes />
        </div>
        <div className="notification-progress-bar"></div>
      </div>
    </div>
  );
};

export default AlertMessage;
