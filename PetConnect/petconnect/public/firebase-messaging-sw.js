importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

// Configuración de depuración
const DEBUG = true;
function logDebug(...args) {
  if (DEBUG) {
    console.log("[firebase-messaging-sw.js]", ...args);
  }
}

// Manejar errores no capturados
self.addEventListener("error", (event) => {
  console.error("[firebase-messaging-sw.js] Error no capturado:", event.error);
});

// Inicializar la aplicación Firebase
try {
  firebase.initializeApp({
    apiKey: "AIzaSyCM5xWBhxVDAm3rfWGQ6PcRF-vH6lsjXTQ",
    authDomain: "petconnect-c839e.firebaseapp.com",
    projectId: "petconnect-c839e",
    storageBucket: "petconnect-c839e.appspot.com",
    messagingSenderId: "1058569538300",
    appId: "1:1058569538300:web:7aae9c7bb926bf2078a579",
    measurementId: "G-FL2KPK8LWB",
  });
  logDebug("Firebase inicializado correctamente");
} catch (error) {
  console.error(
    "[firebase-messaging-sw.js] Error al inicializar Firebase:",
    error
  );
}

// Obtener una instancia de Firebase Messaging
let messaging;
try {
  messaging = firebase.messaging();
  logDebug("Firebase Messaging inicializado correctamente");
} catch (error) {
  console.error(
    "[firebase-messaging-sw.js] Error al inicializar Firebase Messaging:",
    error
  );
}

// Manejar mensajes en segundo plano
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    logDebug("Recibido mensaje en segundo plano:", payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: "/images/Logo_gradient.png",
      badge: "/images/Logo_black.png",
      data: payload.data,
      requireInteraction: true,
      vibrate: [200, 100, 200]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.warn(
    "[firebase-messaging-sw.js] No se pudo inicializar el servicio de mensajería"
  );
}

// Evento de instalación del Service Worker
self.addEventListener("install", (event) => {
  logDebug("Service Worker instalado");
  // Asegurar que el service worker se active inmediatamente
  event.waitUntil(self.skipWaiting());
});

// Evento de activación del Service Worker
self.addEventListener("activate", (event) => {
  logDebug("Service Worker activado");
  // Toma el control de todos los clientes inmediatamente
  event.waitUntil(self.clients.claim());
});

// Manejar clic en notificación
self.addEventListener("notificationclick", (event) => {
  logDebug("Notificación clickeada", event);

  // Cerrar la notificación
  event.notification.close();

  try {
    // Obtener la URL de los datos de la notificación
    const urlToOpen = event.notification.data?.url || "/";

    // Abrir o enfocar la ventana
    event.waitUntil(
      clients.matchAll({
        type: "window",
        includeUncontrolled: true
      }).then((clientList) => {
        // Buscar una ventana existente
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Si no hay ventana existente, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  } catch (error) {
    console.error(
      "[firebase-messaging-sw.js] Error al manejar clic en notificación:",
      error
    );
  }
});

// Manejar cierre de notificaciones
self.addEventListener("notificationclose", (event) => {
  console.log("Notificación cerrada:", event);
});
