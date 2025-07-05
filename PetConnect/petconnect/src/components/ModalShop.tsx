import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import "../styles/ModalShop.css";

interface ModalShopProps {
  isOpen: boolean;
  total: number;
  onClose: () => void;
}

const ModalShop: React.FC<ModalShopProps> = ({ isOpen, total, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="order-confirm-overlay" onClick={onClose}>
      <div
        className="order-confirm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="order-confirm-close" onClick={onClose}>
          ×
        </button>
        <FaCheckCircle className="order-confirm-icon" />
        <h2>¡Gracias por tu compra!</h2>
        <p>Tu pedido ha sido confirmado correctamente.</p>
        <p className="order-confirm-total">
          Total pagado: ${total.toLocaleString("es-MX")} MXN
        </p>
        <button className="order-confirm-btn" onClick={onClose}>
          Aceptar
        </button>
      </div>
    </div>
  );
};

export default ModalShop;
