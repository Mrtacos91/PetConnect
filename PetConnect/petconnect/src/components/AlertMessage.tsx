import React, { useEffect, useState } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import "../styles/AlertMessage.css";

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
      }, 300); // Tiempo para la animación de fade-out
    }, 3000); // El mensaje se oculta después de 3 segundos

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`alert-message ${type} ${visible ? "show" : "hide"}`}>
      {type === "success" ? (
        <FaCheckCircle className="alert-icon" />
      ) : (
        <FaTimesCircle className="alert-icon" />
      )}
      <span>{message}</span>
    </div>
  );
};

export default AlertMessage;
