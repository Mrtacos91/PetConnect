import React from "react";
import "../styles/dashboard.css";

const UserInfo: React.FC = () => {
  return (
    <div className="user-info">
      <h3>Mary Roehitt</h3>
      <p>Phone: +123456789</p>
      <p>Email: mary@example.com</p>
    </div>
  );
};

export default UserInfo;
