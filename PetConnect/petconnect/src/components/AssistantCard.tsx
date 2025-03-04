import React, { useState } from "react";
import "../styles/Assistant.css";

interface AssistantCardProps {
  url: string;
}

const AssistantCard: React.FC<AssistantCardProps> = ({ url }) => {
  const [loading, setLoading] = useState(true);

  return (
    <div className="assistant-card">
      {loading && <div className="skeleton-loader"></div>}
      <iframe
        src={url}
        title="Assistant View"
        className="assistant-iframe"
        sandbox="allow-scripts allow-same-origin allow-popups"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
};

export default AssistantCard;
