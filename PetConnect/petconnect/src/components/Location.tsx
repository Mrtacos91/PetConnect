import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { Icon, Map as LeafletMap, LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/LocationMap.css";

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
  const mapRef = useRef<LeafletMap | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [petLocation, setPetLocation] = useState({
    lat: latitude,
    lng: longitude,
  });
  const [houseLocation, setHouseLocation] = useState({
    lat: latitude,
    lng: longitude,
  });
  const [safeZoneRadius, setSafeZoneRadius] = useState(100);
  const [isOutsideSafeZone, setIsOutsideSafeZone] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setLastUpdated(new Date().toLocaleString());
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const customIcon = new Icon({
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const houseIcon = new Icon({
    iconUrl:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='%23FFA500' d='M12 2L2 12h3v8h10v-8h3z'/%3E%3C/svg%3E",
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isEditMode) {
        return;
      }

      const newLatitude = latitude + (Math.random() - 0.5) * 0.0005;
      const newLongitude = longitude + (Math.random() - 0.5) * 0.0005;
      setPetLocation({ lat: newLatitude, lng: newLongitude });

      const distance = getDistance(
        houseLocation.lat,
        houseLocation.lng,
        newLatitude,
        newLongitude
      );
      if (distance > safeZoneRadius) {
        setIsOutsideSafeZone(true);
        alert(`${name} ha salido de la zona segura!`);
      } else {
        setIsOutsideSafeZone(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [latitude, longitude, safeZoneRadius, isEditMode, houseLocation]);

  const handleRadiusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSafeZoneRadius(Number(event.target.value));
  };

  const handleEditModeToggle = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      setPetLocation({ lat: latitude, lng: longitude });
      setHouseLocation({ lat: latitude, lng: longitude });
      setSafeZoneRadius(100);
    }
  };

  const handleMapClick = (e: LeafletMouseEvent) => {
    if (isEditMode) {
      setHouseLocation({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    }
  };

  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      map.on("click", handleMapClick);
      return () => map.off("click", handleMapClick);
    }
    return () => {};
  }, [mapRef, isEditMode, handleMapClick]);

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
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Safe zone circle */}
            <Circle
              center={[houseLocation.lat, houseLocation.lng]}
              radius={safeZoneRadius}
              color="blue"
              fillColor="blue"
              fillOpacity={0.2}
            />

            {/* House marker */}
            <Marker
              position={[houseLocation.lat, houseLocation.lng]}
              draggable={isEditMode}
              icon={houseIcon}
              eventHandlers={{
                dragend: (e) => {
                  if (isEditMode) {
                    setHouseLocation({
                      lat: e.target.getLatLng().lat,
                      lng: e.target.getLatLng().lng,
                    });
                  }
                },
              }}
            >
              <Popup>Ubicación de la casa</Popup>
            </Marker>

            {/* Pet marker */}
            <Marker
              position={[petLocation.lat, petLocation.lng]}
              icon={customIcon}
            >
              <Popup>
                {name} está aquí <br />
                {isOutsideSafeZone
                  ? "⚠️ Fuera de la zona segura"
                  : "✅ Dentro de la zona segura"}
              </Popup>
            </Marker>
          </MapContainer>

          <div className="pet-location-info">
            <p>
              <strong>Nombre de la mascota:</strong> {name}
            </p>
            <p>
              <strong>Ubicación de la casa:</strong>{" "}
              {houseLocation.lat.toFixed(6)},{houseLocation.lng.toFixed(6)}
            </p>
            <p>
              <strong>Última ubicación:</strong> {petLocation.lat.toFixed(6)},
              {petLocation.lng.toFixed(6)}
            </p>
            <p>
              <strong>Última actualización:</strong> {lastUpdated}
            </p>
            <p>
              <strong>Estado:</strong>{" "}
              {isOutsideSafeZone
                ? "⚠️ Fuera de la zona segura"
                : "✅ Dentro de la zona segura"}
            </p>
          </div>
          {/* Control panel for editing */}
          <div className="control-panel">
            <h3>Configuración de la zona segura</h3>
            <div className="radius-control">
              <label htmlFor="radius">Radio de zona segura (metros):</label>
              <input
                type="range"
                id="radius"
                min="50"
                max="500"
                value={safeZoneRadius}
                onChange={handleRadiusChange}
                disabled={!isEditMode}
              />
              <span>{safeZoneRadius} m</span>
            </div>

            <button onClick={handleEditModeToggle} className="edit-button">
              {isEditMode ? "Guardar cambios" : "Editar ubicación"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LocationMap;
