// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";

export const VAPID_KEY =
  "BHcoQ51F4626heoEPCv6m2ofkWAbqOGxb-90DO_9ljj7A__8kC22n42GngzidG50oAv68IhHqPS_4iyMrVmWny0";
export const firebaseConfig = {
  apiKey: "AIzaSyCM5xWBhxVDAm3rfWGQ6PcRF-vH6lsjXTQ",
  authDomain: "petconnect-c839e.firebaseapp.com",
  projectId: "petconnect-c839e",
  storageBucket: "petconnect-c839e.appspot.com",
  messagingSenderId: "1058569538300",
  appId: "1:1058569538300:web:7aae9c7bb926bf2078a579",
  measurementId: "G-FL2KPK8LWB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Inicializar FCM con manejo de errores
let messaging: ReturnType<typeof getMessaging> | null = null;

// Verificar soporte para FCM y luego inicializar
const initMessaging = async () => {
  try {
    // Primero verificar si FCM es compatible con este navegador
    const isFCMSupported = await isSupported();

    if (!isFCMSupported) {
      console.warn(
        "Firebase Cloud Messaging no es compatible con este navegador"
      );
      return null;
    }

    // Solo inicializar messaging en el navegador y si el service worker es compatible
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const messagingInstance = getMessaging(app);
      console.log("Firebase Cloud Messaging inicializado correctamente");
      return messagingInstance;
    } else {
      console.warn("Service Worker no es compatible con este navegador");
      return null;
    }
  } catch (error) {
    console.error("Error al inicializar Firebase Cloud Messaging:", error);
    return null;
  }
};

// Inicializar messaging de forma asíncrona
if (typeof window !== "undefined") {
  initMessaging().then((messagingInstance) => {
    messaging = messagingInstance;
  });
}

// Función para enviar una solicitud al servidor para enviar una notificación push
// Esta función es solo un ejemplo - necesitarás implementar un servidor que utilice
// Firebase Admin SDK para enviar las notificaciones
export const sendPushNotificationToServer = async (
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  try {
    // URL del servidor de notificaciones
    const serverUrl =
      process.env.NODE_ENV === "production"
        ? "https://petconnect-c839e.web.app/api/notifications/send"
        : "http://localhost:5000/api/notifications/send";

    const response = await fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.REACT_APP_FIREBASE_SERVER_KEY}`,
      },
      body: JSON.stringify({
        token,
        notification: {
          title,
          body,
          icon: "/images/Logo_gradient.png",
        },
        data: data || {},
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Error al enviar la solicitud: ${response.status} - ${
          errorData.message || "Error desconocido"
        }`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error al enviar la notificación push:", error);
    throw error;
  }
};

// Función para verificar y obtener un token FCM
export const getOrCreateFCMToken = async (
  vapidKey: string = VAPID_KEY
): Promise<string | null> => {
  try {
    // Verificar si messaging está inicializado
    if (!messaging) {
      console.warn("Firebase Messaging no está inicializado");
      return null;
    }

    // Verificar si tenemos un token en localStorage
    const savedToken = localStorage.getItem("fcmToken");
    if (savedToken) {
      // Validar que el token sigue siendo válido
      // En una implementación real, podrías verificar con el servidor
      return savedToken;
    }

    // Verificar si tenemos permisos
    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Permiso de notificación no concedido");
        return null;
      }
    }

    // Obtener registration de service worker
    const registration = await navigator.serviceWorker.ready;

    // Obtener nuevo token
    const newToken = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (newToken) {
      // Guardar token en localStorage
      localStorage.setItem("fcmToken", newToken);
      return newToken;
    }

    return null;
  } catch (error) {
    console.error("Error al obtener token FCM:", error);
    return null;
  }
};

export { app, analytics, messaging, getToken, onMessage, isSupported };
