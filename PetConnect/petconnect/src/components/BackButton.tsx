import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BackButton.css';

interface BackButtonProps {
  route?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ route }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (route) {
      navigate(route);
    } else {
      navigate(-1);
    }
  };

  return (
    <button className="backBT" onClick={handleClick}>
      <span className="backBT-content">
        Volver
      </span>
    </button>
  );
};

export default BackButton;