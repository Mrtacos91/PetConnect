import React, { useState, useEffect, useRef } from "react";
import "../styles/LocationCard.css";
import { FaMapMarkerAlt } from "react-icons/fa";
import supabase from "../supabase";
import { Session } from "@supabase/supabase-js";

// 📌 Propiedades del componente
interface LocationCardProps {
  name: string;
  viewMap: () => void;
  setActiveTab: (tab: string) => void;
}

// Caché para almacenar direcciones por coordenadas
const addressCache: Record<string, string> = {};

// Función para obtener dirección con timeout y reintentos
const fetchAddressWithTimeout = async (
  lat: number,
  lng: number,
  cacheKey: string
): Promise<string> => {
  // Establecer inmediatamente un valor de respaldo (coordenadas) en caso de fallo
  const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  // Número máximo de intentos
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Crear un controlador de aborto para el timeout
      const controller = new AbortController();
      // Reducir el timeout a 3 segundos para evitar bloqueos largos
      const timeoutId = setTimeout(() => controller.abort(), 3000);

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

      // Limpiar el timeout
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(
          `Error HTTP: ${response.status}, manteniendo última dirección válida`
        );
        // No guardamos en caché las coordenadas para permitir futuros intentos
        return fallbackAddress;
      }

      const addressData = await response.json();
      let address = "";

      if (addressData.address) {
        const parts = [];

        if (addressData.address.road) parts.push(addressData.address.road);
        if (addressData.address.house_number)
          parts.push(addressData.address.house_number);
        if (addressData.address.suburb) parts.push(addressData.address.suburb);
        if (addressData.address.city || addressData.address.town)
          parts.push(addressData.address.city || addressData.address.town);
        if (addressData.address.state) parts.push(addressData.address.state);

        address = parts.join(", ");

        // Si no se pudo construir una dirección con las partes, usar display_name como respaldo
        if (!address && addressData.display_name) {
          address = addressData.display_name;
        }
      } else if (addressData.display_name) {
        address = addressData.display_name;
      }

      // Si después de todo no tenemos dirección, usar las coordenadas
      if (!address) {
        console.warn(
          "No se pudo obtener una dirección válida, usando coordenadas"
        );
        address = fallbackAddress;
      }

      // Guardar en caché y devolver
      addressCache[cacheKey] = address;
      return address;
    } catch (error: any) {
      // Si es un error de timeout o conexión y no es el último intento, reintentar
      const isTimeoutOrNetworkError =
        error.name === "AbortError" ||
        error.message.includes("Failed to fetch");

      if (isTimeoutOrNetworkError && attempt < maxRetries) {
        // Esperar con backoff exponencial (1s, 2s, 4s, etc.)
        const backoffTime = Math.pow(2, attempt) * 1000;
        console.log(
          `Reintentando obtener dirección en ${backoffTime / 1000}s...`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
      } else if (attempt === maxRetries) {
        // Si es el último intento, mantener la última dirección válida
        console.error(
          "Error final obteniendo dirección, manteniendo última dirección válida"
        );
        // No guardamos en caché las coordenadas para permitir futuros intentos
        return fallbackAddress;
      }
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  console.error(
    "Todos los intentos fallaron, manteniendo última dirección válida"
  );
  // No guardamos en caché las coordenadas para permitir futuros intentos
  return fallbackAddress;
};

const LocationCard: React.FC<LocationCardProps> = ({
  name,
  viewMap,
  setActiveTab,
}) => {
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [location, setLocation] = useState<string>("");
  const [hour, setHour] = useState<string>("");
  const [lastLocation, setLastLocation] = useState<string>("");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // Referencias para almacenar los valores previos
  const prevLatitude = useRef<string | null>(null);
  const prevLongitude = useRef<string | null>(null);
  const prevDate = useRef<string | null>(null);
  const prevTime = useRef<string | null>(null);

  // Obtener la sesión del usuario al cargar el componente
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: any, session: Session | null) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Referencias para almacenar la dirección previa
  const prevAddress = useRef<string | null>(null);

  // Cargar datos de ubicación cuando tengamos la sesión
  useEffect(() => {
    if (session) {
      // Registrar el tiempo de inicio para asegurar un mínimo de 2 segundos
      const startTime = Date.now();

      const loadLocationWithMinTime = async () => {
        await fetchLocationData();

        // Calcular cuánto tiempo ha pasado
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 2000 - elapsedTime);

        // Si ha pasado menos de 2 segundos, esperar el tiempo restante
        setTimeout(() => {
          setShowSkeleton(false);
        }, remainingTime);
      };

      loadLocationWithMinTime();

      // Configurar un intervalo para actualizar los datos cada 60 segundos (aumentado para reducir llamadas)
      const interval = setInterval(fetchLocationData, 60000);

      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchLocationData = async () => {
    try {
      // Ya no necesitamos establecer isLoading

      // Obtener el ID del dispositivo asociado al usuario
      const { data: userData, error: userError } = await supabase
        .from("Users")
        .select("id, device")
        .eq("email", session?.user.email)
        .single();

      if (userError || !userData) {
        console.error("Error obteniendo datos del usuario:", userError);
        return;
      }

      // Si el usuario tiene un dispositivo asociado
      if (userData.device) {
        // Obtener los datos de ubicación más recientes para ese dispositivo
        const { data: locationData, error: locationError } = await supabase
          .from("LocationGps")
          .select("Latitude, Longitude, Time, Date")
          .eq("device_id", userData.device)
          .order("Date", { ascending: false })
          .order("Time", { ascending: false })
          .limit(1)
          .single();

        if (!locationError && locationData) {
          // Verificar si los datos han cambiado antes de actualizar
          const hasChanged =
            prevLatitude.current !== locationData.Latitude ||
            prevLongitude.current !== locationData.Longitude ||
            prevDate.current !== locationData.Date ||
            prevTime.current !== locationData.Time;

          // Solo actualizar si los datos han cambiado
          if (hasChanged) {
            console.log(
              "Datos GPS actualizados en LocationCard:",
              locationData
            );

            // Actualizar referencias
            prevLatitude.current = locationData.Latitude;
            prevLongitude.current = locationData.Longitude;
            prevDate.current = locationData.Date;
            prevTime.current = locationData.Time;

            // Crear una clave única para la caché basada en las coordenadas
            const cacheKey = `${locationData.Latitude},${locationData.Longitude}`;

            // Convertir coordenadas a números
            const lat =
              typeof locationData.Latitude === "string"
                ? parseFloat(locationData.Latitude)
                : locationData.Latitude;

            const lng =
              typeof locationData.Longitude === "string"
                ? parseFloat(locationData.Longitude)
                : locationData.Longitude;

            // Establecer coordenadas como dirección inicial/fallback
            const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

            // Verificar si ya tenemos esta dirección en caché
            if (addressCache[cacheKey]) {
              const cachedAddress = addressCache[cacheKey];

              // Verificar si la dirección obtenida es solo coordenadas (fallback)
              const isCoordinateFormat = /^-?\d+\.\d+, -?\d+\.\d+$/.test(
                cachedAddress
              );

              // Solo actualizar si es una dirección real (no coordenadas) y diferente a la anterior
              if (
                !isCoordinateFormat &&
                cachedAddress !== prevAddress.current
              ) {
                console.log(
                  "Actualizando dirección desde caché:",
                  cachedAddress
                );
                setLocation(cachedAddress);
                prevAddress.current = cachedAddress;
              } else if (isCoordinateFormat && !prevAddress.current) {
                // Solo usar coordenadas si no tenemos una dirección previa
                console.log("Usando coordenadas como dirección inicial");
                setLocation(cachedAddress);
              }
            } else {
              // Solo establecer coordenadas si no hay dirección previa
              if (!prevAddress.current) {
                console.log("Estableciendo coordenadas como dirección inicial");
                setLocation(fallbackAddress);
              }

              // Intentar obtener una dirección más precisa de la API (sin bloquear la UI)
              fetchAddressWithTimeout(lat, lng, cacheKey)
                .then((address: string) => {
                  // Verificar si la dirección obtenida es solo coordenadas (fallback)
                  const isCoordinateFormat = /^-?\d+\.\d+, -?\d+\.\d+$/.test(
                    address
                  );

                  // Solo actualizar si es una dirección real (no coordenadas) y diferente a la anterior
                  if (
                    !isCoordinateFormat &&
                    address &&
                    address !== prevAddress.current
                  ) {
                    console.log("Actualizando dirección desde API:", address);
                    setLocation(address);
                    prevAddress.current = address;
                  }
                })
                .catch((error: any) => {
                  console.error("Error final obteniendo dirección:", error);
                  setLocationError("No se pudo obtener la dirección exacta");
                  // Ya tenemos el fallback establecido, no necesitamos hacer nada más
                });
            }

            // Formatear la hora y fecha
            const formattedDateTime = `${locationData.Date} ${locationData.Time}`;
            setHour(formattedDateTime);
            setLastLocation(`Última actualización: ${formattedDateTime}`);
          }
        } else {
          console.error("Error obteniendo datos de ubicación:", locationError);
          setLocation("No hay datos de ubicación disponibles");
          setHour("N/A");
          setLastLocation("Sin actualizaciones recientes");
          setLocationError("Error al obtener datos de ubicación");
        }
      } else {
        setLocation("No hay dispositivo GPS asociado");
        setHour("N/A");
        setLastLocation("Sin dispositivo GPS");
      }
    } catch (error) {
      console.error("Error en fetchLocationData:", error);
    } finally {
      // Ya no necesitamos actualizar isLoading aquí, ya que usamos showSkeleton para el renderizado
    }
  };

  const handleCardClick = () => {
    setActiveTab("localizar"); // 🔹 Cambiamos a la pestaña de actividades
  };

  return (
    <div className="highlight-container-location" onClick={handleCardClick}>
      <h2 className="highlight-title-location">Ubicación actual</h2>

      {showSkeleton ? (
        // 🔹 Skeleton Loader
        <div className="skeleton-container-location">
          <div className="skeleton skeleton-button-location"></div>
          <div className="skeleton skeleton-text-location"></div>
          <div className="skeleton skeleton-text-location"></div>
          <div className="skeleton skeleton-text-location"></div>
          <div className="skeleton skeleton-text-location"></div>
        </div>
      ) : (
        // 🔹 Contenido real
        <div className="location-card">
          <div className="location-card__header">
            <button className="location-card__button" onClick={viewMap}>
              Ver en el mapa <FaMapMarkerAlt />
            </button>
          </div>

          {/* Información de la ubicación */}
          <div className="location-card__info">
            <p>
              🐾 <strong>{name}</strong>
            </p>
            <p>
              📍 <strong>Ubicación actual:</strong> {location}
              {locationError && (
                <span className="location-error" title={locationError}>
                  {" "}
                  ⚠️
                </span>
              )}
            </p>
            <p>
              🕒 <strong>Última actualización:</strong> {hour}
            </p>
            <p>
              🔄 <strong>Última ubicación registrada:</strong> {lastLocation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationCard;
