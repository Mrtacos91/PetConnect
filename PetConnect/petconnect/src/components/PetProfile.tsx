import React from "react";
import "../styles/dashboard.css";

interface PetProfileProps {
  imageUrl: string;
  name: string;
  status: string;
}

const PetProfile: React.FC<PetProfileProps> = ({ imageUrl, name, status }) => {
  return (
    <div className="pet-profile">
      <img src={imageUrl} alt={name} /> {/* Pasamos la URL como prop */}
      <h3>{name}</h3>
      <p>{status}</p>
    </div>
  );
};

export default PetProfile;
