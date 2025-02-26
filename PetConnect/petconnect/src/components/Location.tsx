import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "../styles/LocationMap.css";
import "leaflet/dist/leaflet.css";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  name: string;
}

const LocationMap: React.FC<LocationMapProps> = ({
  latitude,
  longitude,
  name,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    // Simula un tiempo de carga de 2 segundos
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Simula la última actualización con la fecha y hora actual
      setLastUpdated(new Date().toLocaleString());
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Configuración de un ícono personalizado para el marcador
  const customIcon = new Icon({
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  return (
    <div className="location-map-container">
      <h2 className="location-map-title">Ubicación actual</h2>
      {isLoading ? (
        <div className="skeleton-location"></div>
      ) : (
        <>
          <MapContainer
            center={[latitude, longitude]}
            zoom={15}
            scrollWheelZoom={false}
            className="map"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[latitude, longitude]} icon={customIcon}>
              <Popup>{name} está aquí</Popup>
            </Marker>
          </MapContainer>

          {/* Información de la localización de la mascota */}
          <div className="pet-location-info">
            <p>
              <strong>Nombre de la mascota:</strong> {name}
            </p>
            <p>
              <strong>Última ubicación:</strong> {latitude.toFixed(6)},{" "}
              {longitude.toFixed(6)}
            </p>
            <p>
              <strong>Última actualización:</strong> {lastUpdated}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default LocationMap;
