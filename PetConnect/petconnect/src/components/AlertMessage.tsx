import React, { useEffect, useState } from "react";
import { FaCheckCircle, FaTimesCircle, FaTimes } from "react-icons/fa";
import "../styles/style.css";

interface AlertMessageProps {
  message: string;
  type: "success" | "error";
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

  return (
    <div className="notification-container">
      <div className={`notification-item ${type}`}>
        <div className="notification-content">
          <span className="notification-icon">
            {type === "success" ? <FaCheckCircle /> : <FaTimesCircle />}
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
