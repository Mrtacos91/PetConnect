import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { Icon, Map as LeafletMap, LeafletMouseEvent } from "leaflet";
import { FaCheck, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import "leaflet/dist/leaflet.css";
import "../styles/LocationMap.css";
import "../styles/style.css";

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
  const [houseAddress, setHouseAddress] = useState<string>("");
  const [petAddress, setPetAddress] = useState<string>("");
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "error" | "warning";
      message: string;
    }>
  >([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setLastUpdated(new Date().toLocaleString());
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const showNotification = (
    type: "success" | "error" | "warning",
    message: string
  ) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
    }, 5000);
  };

  const closeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const getAddressFromCoordinates = async (
    lat: number,
    lng: number
  ): Promise<string> => {
    try {
      setIsAddressLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "es",
            "User-Agent": "PetConnect/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo obtener la dirección");
      }

      const data = await response.json();

      let address = "";

      if (data.address) {
        const parts = [];

        if (data.address.road) parts.push(data.address.road);
        if (data.address.house_number) parts.push(data.address.house_number);
        if (data.address.suburb) parts.push(data.address.suburb);
        if (data.address.city || data.address.town)
          parts.push(data.address.city || data.address.town);
        if (data.address.state) parts.push(data.address.state);

        address = parts.join(", ");
      } else {
        address = data.display_name || "Dirección desconocida";
      }

      return address;
    } catch (error) {
      console.error("Error al obtener la dirección:", error);
      return "No se pudo obtener la dirección";
    } finally {
      setIsAddressLoading(false);
    }
  };

  useEffect(() => {
    const updateHouseAddress = async () => {
      const address = await getAddressFromCoordinates(
        houseLocation.lat,
        houseLocation.lng
      );
      setHouseAddress(address);
    };

    updateHouseAddress();
  }, [houseLocation]);

  useEffect(() => {
    const updatePetAddress = async () => {
      const address = await getAddressFromCoordinates(
        petLocation.lat,
        petLocation.lng
      );
      setPetAddress(address);
    };

    updatePetAddress();
  }, [petLocation]);

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
        showNotification(
          "warning",
          `¡${name} ha salido de la zona segura! Está a ${Math.round(
            distance
          )} metros de casa.`
        );
      } else {
        setIsOutsideSafeZone(false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [latitude, longitude, safeZoneRadius, isEditMode, houseLocation, name]);

  const handleRadiusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSafeZoneRadius(Number(event.target.value));
  };

  const handleEditModeToggle = () => {
    if (isEditMode) {
      showNotification(
        "success",
        "¡Configuración de zona segura guardada correctamente!"
      );
    }
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
      <div className="notification-container">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-item ${notification.type}`}
          >
            <div className="notification-content">
              <div className="notification-icon">
                {notification.type === "success" ? (
                  <FaCheck />
                ) : notification.type === "warning" ? (
                  <FaExclamationTriangle />
                ) : (
                  <FaTimes />
                )}
              </div>
              <div className="notification-text">{notification.message}</div>
            </div>
            <div
              className="notification-close"
              onClick={() => closeNotification(notification.id)}
            >
              <FaTimes />
            </div>
            <div className="notification-progress-bar"></div>
          </div>
        ))}
      </div>

      <h2 className="location-map-title">Ubicación actual</h2>

      {isLoading ? (
        <>
          <div className="skeleton-location"></div>
          <div className="Location-info">
            <div className="skeleton-card">
              <div className="skeleton-title"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text"></div>
            </div>
            <div className="skeleton-card">
              <div className="skeleton-title"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-slider"></div>
              <div className="skeleton-button"></div>
            </div>
          </div>
        </>
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

            <Circle
              center={[houseLocation.lat, houseLocation.lng]}
              radius={safeZoneRadius}
              color="blue"
              fillColor="blue"
              fillOpacity={0.2}
            />

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
              <Popup>
                Ubicación de la casa
                <br />
                {isAddressLoading ? "Cargando dirección..." : houseAddress}
              </Popup>
            </Marker>

            <Marker
              position={[petLocation.lat, petLocation.lng]}
              icon={customIcon}
            >
              <Popup>
                {name} está aquí <br />
                {isAddressLoading ? "Cargando dirección..." : petAddress}
                <br />
                {isOutsideSafeZone
                  ? "⚠️ Fuera de la zona segura"
                  : "✅ Dentro de la zona segura"}
              </Popup>
            </Marker>
          </MapContainer>

          <div className="Location-info">
            <div className="pet-location-info">
              <p>
                <strong>Nombre de la mascota:</strong> {name}
              </p>
              <p>
                <strong>Ubicación de la casa:</strong>{" "}
                {isAddressLoading ? "Cargando dirección..." : houseAddress}
                <span className="coordinates-small">
                  ({houseLocation.lat.toFixed(6)},{" "}
                  {houseLocation.lng.toFixed(6)})
                </span>
              </p>
              <p>
                <strong>Última ubicación:</strong>{" "}
                {isAddressLoading ? "Cargando dirección..." : petAddress}
                <span className="coordinates-small">
                  ({petLocation.lat.toFixed(6)}, {petLocation.lng.toFixed(6)})
                </span>
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
          </div>
        </>
      )}
    </div>
  );
};

export default LocationMap;
