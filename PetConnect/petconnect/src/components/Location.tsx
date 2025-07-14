import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { Icon, Map as LeafletMap, LeafletMouseEvent } from "leaflet";
import { FaCheck, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import "leaflet/dist/leaflet.css";
import "../styles/LocationMap.css";
import "../styles/style.css";
import "../styles/ConfDevice.css";
import supabase from "../supabase";
import ConfigureDevice from "./ConfigureDevice";

// Caché para almacenar direcciones por coordenadas
const addressCache: Record<string, string> = {};

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
  // Track if GPS device is present
  const [hasGpsDevice, setHasGpsDevice] = useState<boolean | null>(null);
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
  // Nombre de la mascota asociada al dispositivo
  const [petName, setPetName] = useState<string>(name);
  const petNameRef = useRef<string>(name);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "error" | "warning";
      message: string;
    }>
  >([]);

  const [showConfigureDevice, setShowConfigureDevice] = useState(false);

  useEffect(() => {
    const fetchLocationData = async () => {
      setIsLoading(true);

      try {
        // Obtener el usuario actual
        const { data: sessionData } = await supabase.auth.getUser();
        if (!sessionData?.user?.email) {
          console.error("Usuario no autenticado");
          setIsLoading(false);
          return;
        }

        // Obtener el usuario local con su device_id
        const { data: userData, error: userError } = await supabase
          .from("Users")
          .select("id, device")
          .eq("email", sessionData.user.email)
          .single();

        if (userError || !userData) {
          console.error("Error obteniendo datos del usuario:", userError);
          setIsLoading(false);
          return;
        }

        // Si el usuario tiene un dispositivo asociado
        const hasGpsDevice = !!userData.device;
        setHasGpsDevice(hasGpsDevice);
        // Obtener la mascota asociada a este dispositivo
        if (userData.device) {
          console.log("Buscando mascota con device_id:", userData.device);

          // Solo actualizar si el nombre actual es el predeterminado
          if (petNameRef.current === name) {
            try {
              // Buscar directamente la mascota con este device_id
              const { data: petData, error } = await supabase
                .from("Pets")
                .select("pet_name")
                .eq("device_id", userData.device)
                .single();

              if (error) {
                console.error("Error en la consulta de mascota:", error);
              } else if (petData?.pet_name) {
                console.log("Mascota encontrada:", petData.pet_name);
                petNameRef.current = petData.pet_name;
                setPetName(petData.pet_name);
              } else {
                console.log("No se encontró mascota con este device_id");
              }
            } catch (err) {
              console.error("Error obteniendo mascota:", err);
            }
          }
        } else {
          console.log("No hay dispositivo configurado");
          petNameRef.current = name;
          setPetName(name);
        }
        if (hasGpsDevice) {
          // Obtener los datos de ubicación más recientes para ese dispositivo
          const { data: locationData, error: locationError } = await supabase
            .from("LocationGps")
            .select("Latitude, Longitude, Time, Date, safe_zone, house_initial")
            .eq("device_id", userData.device)
            .order("Date", { ascending: false })
            .order("Time", { ascending: false })
            .limit(1)
            .single();

          if (!locationError && locationData) {
            console.log("Datos GPS recibidos:", locationData);

            // Asegurarse de que los valores sean números
            const lat =
              typeof locationData.Latitude === "string"
                ? parseFloat(locationData.Latitude)
                : locationData.Latitude;

            const lng =
              typeof locationData.Longitude === "string"
                ? parseFloat(locationData.Longitude)
                : locationData.Longitude;

            // Verificar que los valores sean válidos antes de actualizar
            if (!isNaN(lat) && !isNaN(lng)) {
              console.log(`Actualizando ubicación a: lat=${lat}, lng=${lng}`);
              setPetLocation({
                lat: lat,
                lng: lng,
              });

              // Centrar el mapa en la nueva ubicación si está disponible
              if (mapRef.current) {
                mapRef.current.setView([lat, lng], mapRef.current.getZoom());
              }
            } else {
              console.error("Valores de latitud/longitud inválidos:", {
                lat,
                lng,
              });
            }

            // Actualizar el radio de la zona segura si existe en la base de datos
            if (locationData.safe_zone) {
              console.log(
                "Zona segura cargada desde la base de datos:",
                locationData.safe_zone
              );
              setSafeZoneRadius(locationData.safe_zone);
            }

            // Cargar las coordenadas de la casa desde house_initial si existen
            if (locationData.house_initial) {
              try {
                let houseLat, houseLng;

                // Verificar si house_initial ya es un array o es una cadena
                if (Array.isArray(locationData.house_initial)) {
                  // Si ya es un array, usamos directamente los valores
                  [houseLat, houseLng] = locationData.house_initial.map(Number);
                  console.log(
                    "Coordenadas recibidas como array:",
                    houseLat,
                    houseLng
                  );
                } else if (typeof locationData.house_initial === "string") {
                  // Si es una cadena, procesamos el formato PostgreSQL
                  const coordsString = locationData.house_initial.replace(
                    /[{}]/g,
                    ""
                  );
                  [houseLat, houseLng] = coordsString.split(",").map(Number);
                  console.log(
                    "Coordenadas recibidas como string:",
                    houseLat,
                    houseLng
                  );
                } else {
                  // Si no es ni array ni string, loguear el tipo para depuración
                  console.error(
                    "Tipo inesperado para house_initial:",
                    typeof locationData.house_initial
                  );
                  console.log("Valor recibido:", locationData.house_initial);
                  throw new Error("Formato de coordenadas no reconocido");
                }

                // Verificar que los valores sean válidos
                if (!isNaN(houseLat) && !isNaN(houseLng)) {
                  console.log(
                    "Ubicación de casa cargada desde la base de datos:",
                    houseLat,
                    houseLng
                  );
                  setHouseLocation({
                    lat: houseLat,
                    lng: houseLng,
                  });
                }
              } catch (error) {
                console.error(
                  "Error al procesar las coordenadas de la casa:",
                  error
                );
              }
            }

            setLastUpdated(`${locationData.Date} ${locationData.Time}`);
          } else {
            console.error(
              "Error obteniendo datos de ubicación:",
              locationError
            );
          }
        }
      } catch (error) {
        console.error("Error en la obtención de datos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocationData();

    // Actualizar datos cada 30 segundos
    const intervalId = setInterval(fetchLocationData, 30000);

    return () => clearInterval(intervalId);
  }, [latitude, longitude]);

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

      // Crear una clave única para la caché basada en las coordenadas
      // Redondeamos a 6 decimales para evitar llamadas repetidas por pequeñas variaciones
      const roundedLat = parseFloat(lat.toFixed(6));
      const roundedLng = parseFloat(lng.toFixed(6));
      const cacheKey = `${roundedLat},${roundedLng}`;

      // Verificar si ya tenemos esta dirección en caché
      if (addressCache[cacheKey]) {
        console.log("Usando dirección en caché:", addressCache[cacheKey]);
        return addressCache[cacheKey];
      }

      // Establecer inmediatamente un valor de respaldo (coordenadas) en caso de fallo
      const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

      // Si no está en caché, hacer la solicitud a la API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5 segundos

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "es",
              "User-Agent": "PetConnect/1.0",
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(
            `Error HTTP: ${response.status}, usando coordenadas como respaldo`
          );
          addressCache[cacheKey] = fallbackAddress;
          return fallbackAddress;
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

          // Si no se pudo construir una dirección con las partes, usar display_name como respaldo
          if (!address && data.display_name) {
            address = data.display_name;
          }
        } else if (data.display_name) {
          address = data.display_name;
        }

        // Si después de todo no tenemos dirección, usar las coordenadas
        if (!address) {
          console.warn(
            "No se pudo obtener una dirección válida, usando coordenadas"
          );
          address = fallbackAddress;
        }

        // Guardar en caché
        console.log("Guardando nueva dirección en caché:", address);
        addressCache[cacheKey] = address;
        return address;
      } catch (fetchError: any) {
        // Tipado explícito para el error
        clearTimeout(timeoutId);
        if (fetchError && fetchError.name === "AbortError") {
          console.error(
            "Timeout al obtener la dirección, manteniendo última dirección válida"
          );
          // No guardamos en caché las coordenadas para permitir futuros intentos
          // Si no hay una dirección previa válida, usar coordenadas como último recurso
          return fallbackAddress;
        }
        console.error("Error en la solicitud de dirección:", fetchError);
        // No guardamos en caché las coordenadas para permitir futuros intentos
        return fallbackAddress;
      }
    } catch (error) {
      console.error("Error general al obtener la dirección:", error);
      // No guardamos en caché las coordenadas para permitir futuros intentos
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } finally {
      setIsAddressLoading(false);
    }
  };

  // Referencias para almacenar las coordenadas y direcciones previas
  const prevHouseLat = useRef<number | null>(null);
  const prevHouseLng = useRef<number | null>(null);
  const prevHouseAddress = useRef<string | null>(null);

  useEffect(() => {
    // Verificar si las coordenadas han cambiado significativamente (más de 0.0001 grados)
    const hasLocationChanged =
      prevHouseLat.current === null ||
      prevHouseLng.current === null ||
      Math.abs(houseLocation.lat - prevHouseLat.current) > 0.0001 ||
      Math.abs(houseLocation.lng - prevHouseLng.current) > 0.0001;

    if (hasLocationChanged && hasGpsDevice) {
      const updateHouseAddress = async () => {
        try {
          const address = await getAddressFromCoordinates(
            houseLocation.lat,
            houseLocation.lng
          );

          // Verificar si la dirección obtenida es solo coordenadas (fallback)
          const isCoordinateFormat = /^-?\d+\.\d+, -?\d+\.\d+$/.test(address);

          // Solo actualizar si es una dirección real (no coordenadas) y diferente a la anterior
          if (!isCoordinateFormat && address !== prevHouseAddress.current) {
            console.log("Actualizando dirección de casa:", address);
            setHouseAddress(address);
            prevHouseAddress.current = address;
          } else if (isCoordinateFormat && !prevHouseAddress.current) {
            // Solo usar coordenadas si no tenemos una dirección previa
            console.log("Usando coordenadas como dirección inicial de casa");
            setHouseAddress(address);
          }

          // Actualizar las referencias de coordenadas
          prevHouseLat.current = houseLocation.lat;
          prevHouseLng.current = houseLocation.lng;
        } catch (error) {
          console.error("Error al actualizar dirección de casa:", error);
          // En caso de error, mostrar las coordenadas
          const fallbackAddress = `${houseLocation.lat.toFixed(
            6
          )}, ${houseLocation.lng.toFixed(6)}`;
          setHouseAddress(fallbackAddress);
        }
      };

      updateHouseAddress();
    } else if (!hasGpsDevice) {
      setHouseAddress("");
    }
  }, [houseLocation]);

  // Referencias para almacenar las coordenadas y direcciones previas de la mascota
  const prevPetLat = useRef<number | null>(null);
  const prevPetLng = useRef<number | null>(null);
  const prevPetAddress = useRef<string | null>(null);

  useEffect(() => {
    // Verificar si las coordenadas han cambiado significativamente (más de 0.0001 grados)
    const hasLocationChanged =
      prevPetLat.current === null ||
      prevPetLng.current === null ||
      Math.abs(petLocation.lat - prevPetLat.current) > 0.0001 ||
      Math.abs(petLocation.lng - prevPetLng.current) > 0.0001;

    if (hasLocationChanged && hasGpsDevice) {
      const updatePetAddress = async () => {
        try {
          const address = await getAddressFromCoordinates(
            petLocation.lat,
            petLocation.lng
          );

          // Verificar si la dirección obtenida es solo coordenadas (fallback)
          const isCoordinateFormat = /^-?\d+\.\d+, -?\d+\.\d+$/.test(address);

          // Solo actualizar si es una dirección real (no coordenadas) y diferente a la anterior
          if (!isCoordinateFormat && address !== prevPetAddress.current) {
            console.log("Actualizando dirección de mascota:", address);
            setPetAddress(address);
            prevPetAddress.current = address;
          } else if (isCoordinateFormat && !prevPetAddress.current) {
            // Solo usar coordenadas si no tenemos una dirección previa
            console.log("Usando coordenadas como dirección inicial de mascota");
            setPetAddress(address);
          }

          // Actualizar las referencias de coordenadas
          prevPetLat.current = petLocation.lat;
          prevPetLng.current = petLocation.lng;
        } catch (error) {
          console.error("Error al actualizar dirección de mascota:", error);
          // En caso de error, mostrar las coordenadas
          const fallbackAddress = `${petLocation.lat.toFixed(
            6
          )}, ${petLocation.lng.toFixed(6)}`;
          setPetAddress(fallbackAddress);
        }
      };

      updatePetAddress();
    } else if (!hasGpsDevice) {
      setPetAddress("");
    }
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

  // Función para actualizar la ubicación del mapa
  const updateMapView = () => {
    if (mapRef.current && petLocation.lat && petLocation.lng) {
      mapRef.current.setView(
        [petLocation.lat, petLocation.lng],
        mapRef.current.getZoom()
      );
    }
  };

  // Actualizar la vista del mapa cuando cambie la ubicación de la mascota
  useEffect(() => {
    updateMapView();
  }, [petLocation]);

  // Verificar si la mascota está fuera de la zona segura cuando cambia la ubicación
  useEffect(() => {
    if (isEditMode) {
      return;
    }

    // Solo verificar si hay coordenadas válidas
    if (
      !petLocation.lat ||
      !petLocation.lng ||
      !houseLocation.lat ||
      !houseLocation.lng
    ) {
      return;
    }

    const distance = getDistance(
      houseLocation.lat,
      houseLocation.lng,
      petLocation.lat,
      petLocation.lng
    );

    if (distance > safeZoneRadius) {
      setIsOutsideSafeZone(true);
      showNotification(
        "warning",
        `¡${petName} ha salido de la zona segura! Está a ${Math.round(
          distance
        )} metros de casa.`
      );
    } else {
      setIsOutsideSafeZone(false);
    }
  }, [petLocation, safeZoneRadius, isEditMode, houseLocation, name]);

  const handleRadiusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSafeZoneRadius(Number(event.target.value));
  };

  const handleEditModeToggle = async () => {
    if (isEditMode) {
      try {
        // Obtener el usuario actual
        const { data: sessionData } = await supabase.auth.getUser();
        if (!sessionData?.user?.email) {
          console.error("Usuario no autenticado");
          showNotification("error", "Error al guardar: Usuario no autenticado");
          return;
        }

        // Obtener el usuario local con su device_id
        const { data: userData, error: userError } = await supabase
          .from("Users")
          .select("device")
          .eq("email", sessionData.user.email)
          .single();

        if (userError || !userData) {
          console.error("Error obteniendo datos del usuario:", userError);
          showNotification(
            "error",
            "Error al guardar: No se pudo obtener información del usuario"
          );
          return;
        }

        // Verificar si el usuario tiene un dispositivo asociado
        if (!userData.device) {
          console.error("Usuario sin dispositivo GPS asociado");
          showNotification(
            "error",
            "Error al guardar: No hay dispositivo GPS asociado"
          );
          return;
        }

        // Buscar si ya existe un registro para este dispositivo
        const { data: existingData, error: existingError } = await supabase
          .from("LocationGps")
          .select("device_id")
          .eq("device_id", userData.device)
          .limit(1);

        if (existingError) {
          console.error(
            "Error al verificar registros existentes:",
            existingError
          );
          showNotification(
            "error",
            "Error al guardar: No se pudo verificar registros existentes"
          );
          return;
        }

        let updateResult;

        if (existingData && existingData.length > 0) {
          // Actualizar el registro existente
          // Guardar el radio de la zona segura y las coordenadas de la casa
          // Formato para house_initial como array PostgreSQL: "{latitud,longitud}"
          const houseCoordinates = `{${houseLocation.lat},${houseLocation.lng}}`;

          updateResult = await supabase
            .from("LocationGps")
            .update({
              safe_zone: safeZoneRadius,
              house_initial: houseCoordinates,
            })
            .eq("device_id", userData.device);
        } else {
          // Si no existe un registro, crear uno nuevo
          // Esto es poco probable que ocurra, pero lo manejamos por si acaso
          const now = new Date();
          const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
          const timeStr = now.toTimeString().split(" ")[0]; // HH:MM:SS

          // Formato para house_initial como array PostgreSQL: "{latitud,longitud}"
          const houseCoordinates = `{${houseLocation.lat},${houseLocation.lng}}`;

          updateResult = await supabase.from("LocationGps").insert({
            device_id: userData.device,
            safe_zone: safeZoneRadius,
            Latitude: petLocation.lat,
            Longitude: petLocation.lng,
            Date: dateStr,
            Time: timeStr,
            house_initial: houseCoordinates,
          });
        }

        if (updateResult.error) {
          console.error("Error al guardar la zona segura:", updateResult.error);
          showNotification(
            "error",
            "Error al guardar la zona segura en la base de datos"
          );
        } else {
          console.log("Zona segura guardada correctamente:", safeZoneRadius);
          showNotification(
            "success",
            "¡Configuración de zona segura guardada correctamente!"
          );
        }
      } catch (error) {
        console.error("Error al guardar la zona segura:", error);
        showNotification(
          "error",
          "Error al guardar la zona segura en la base de datos"
        );
      }
    }

    // Toggle edit mode: when entering edit mode, we no longer reset the pet's
    // position so that only the house (safe-zone center) can be moved.
    setIsEditMode(!isEditMode);
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

  const handleDeviceConfigured = useCallback((deviceId: string) => {
    setShowConfigureDevice(false);
    setHasGpsDevice(true);
    showNotification(
      "success",
      `Dispositivo ${deviceId} configurado correctamente`
    );
    // Recargar la página para actualizar los datos
    window.location.reload();
  }, []);

  // Mostrar mensaje si no hay dispositivo GPS vinculado y no está cargando
  if (!isLoading && hasGpsDevice === false) {
    return (
      <>
        <div className="no-gps-container">
          <div className="no-gps-content">
            <div className="no-gps-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="M12 8v4"></path>
                <path d="M12 16h.01"></path>
              </svg>
            </div>
            <h3 className="no-gps-title">Dispositivo GPS no conectado</h3>
            <p className="no-gps-message">
              Para ver la ubicación de tu mascota en tiempo real, necesitas
              vincular un dispositivo GPS.
            </p>
            <button
              className="no-gps-button"
              onClick={() => setShowConfigureDevice(true)}
            >
              Vincular dispositivo GPS
            </button>
          </div>
        </div>

        {/* Modal de configuración de dispositivo */}
        <ConfigureDevice
          isOpen={showConfigureDevice}
          onClose={() => setShowConfigureDevice(false)}
          onSuccess={handleDeviceConfigured}
        />
      </>
    );
  }

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
          <div className="skeleton-location">
            <div
              className="skeleton-text"
              style={{ width: "40%", height: "20px" }}
            ></div>
            <div
              className="skeleton-text"
              style={{ width: "70%", height: "20px" }}
            ></div>
            <div
              className="skeleton-text"
              style={{ width: "60%", height: "20px" }}
            ></div>
            <div
              className="skeleton-text"
              style={{ width: "80%", height: "20px" }}
            ></div>
            <div
              className="skeleton-text"
              style={{ width: "50%", height: "20px" }}
            ></div>
          </div>
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
            center={[petLocation.lat, petLocation.lng]}
            zoom={15}
            scrollWheelZoom={true}
            tapHold={true}
            touchZoom={true}
            zoomControl={true}
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
              color="#48bff3"
              opacity={0.3}
              fillColor="#48bff3"
              fillOpacity={0.3}
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
                {hasGpsDevice === false
                  ? "No hay dispositivo GPS conectado"
                  : isAddressLoading
                  ? "Cargando dirección..."
                  : houseAddress}
              </Popup>
            </Marker>

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
                {hasGpsDevice === false
                  ? "No hay dispositivo GPS conectado"
                  : isAddressLoading
                  ? "Cargando dirección..."
                  : houseAddress}
              </Popup>
            </Marker>

            <Marker
              position={[petLocation.lat, petLocation.lng]}
              icon={customIcon}
            >
              <Popup>
                {petName} está aquí <br />
                {hasGpsDevice === false
                  ? "No hay dispositivo GPS conectado"
                  : isAddressLoading
                  ? "Cargando dirección..."
                  : petAddress}
                <br />
                {isOutsideSafeZone
                  ? "⚠️ Fuera de la zona segura"
                  : "✅ Dentro de la zona segura"}
              </Popup>
            </Marker>
          </MapContainer>

          <div className="Location-info">
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
            <div className="pet-location-info">
              <p>
                <strong>Nombre de la mascota:</strong> {petName}
              </p>
              {hasGpsDevice === false ? (
                <p>
                  <strong>Ubicación de la casa:</strong> No hay dispositivo GPS
                  conectado
                </p>
              ) : (
                <p>
                  <strong>Ubicación de la casa:</strong>{" "}
                  {isAddressLoading ? "Cargando dirección..." : houseAddress}
                  <span className="coordinates-small">
                    ({houseLocation.lat.toFixed(6)},{" "}
                    {houseLocation.lng.toFixed(6)})
                  </span>
                </p>
              )}
              {hasGpsDevice === false ? (
                <p>
                  <strong>Última ubicación:</strong> No hay dispositivo GPS
                  conectado
                </p>
              ) : (
                <p>
                  <strong>Última ubicación:</strong>{" "}
                  {isAddressLoading ? "Cargando dirección..." : petAddress}
                  <span className="coordinates-small">
                    ({petLocation.lat.toFixed(6)}, {petLocation.lng.toFixed(6)})
                  </span>
                </p>
              )}
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
          </div>
        </>
      )}
    </div>
  );
};

export default LocationMap;
