import React, { useState, useEffect } from "react";
import "../styles/FoundCanCard.css";

interface FoundCanCardProps {
    Info: string;
    url?: string; // URL opcional para redirección
}

const FoundCanCard: React.FC<FoundCanCardProps> = ({
    Info,
    url = "https://www.google.com/maps/search/Guarderias+para+mascotas+cerca+de+mi/@19.5553634,-99.3144218,12z/data=!3m1!4b1?entry=ttu&g_ep=EgoyMDI1MDYxNS4wIKXMDSoASAFQAw%3D%3D", // URL por defecto
}) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => setIsLoading(false), 2000); // Simula la carga durante 2 segundos
    }, []);

    const handleCardClick = () => {
        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <div
            className="Container-FoundCan"
            onClick={handleCardClick}
            style={{ cursor: "pointer" }}
        >
            <h2 className="Container-Title-FoundCan">Encuentra una Guarderia</h2>

            {isLoading ? (
                // 🔹 Skeleton Loader
                <div className="skeleton-container-foundCan">
                    <div className="skeleton skeleton-text-foundCan"></div>
                    <div className="skeleton skeleton-text-foundCan"></div>
                </div>
            ) : (
                // 🔹 Contenido real
                <div className="FoundCan-Card">
                    <h3 className="FoundCan-info">
                        <strong>¿Necesitas hospedar a tu mascota?</strong>
                    </h3>
                    <p>{Info}</p>
                </div>
            )}
        </div>
    );
};

export default FoundCanCard;
