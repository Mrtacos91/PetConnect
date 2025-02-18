import React from "react";
import "../styles/dashboard.css";

interface StatsCircleProps {
  imageUrl: string;
}

const StatsCircle: React.FC<StatsCircleProps> = ({ imageUrl }) => {
  return (
    <div className="stats-circle">
      <img src={imageUrl} alt="Pet" />
    </div>
  );
};

export default StatsCircle;
