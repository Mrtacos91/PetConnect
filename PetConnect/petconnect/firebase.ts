// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  Messaging,
} from "firebase/messaging";

// --- Configuration ---
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

// --- Firebase Initialization ---
let app: FirebaseApp;
let analytics: Analytics | null = null;
let messaging: Messaging | null = null;

// Initialize only in the browser
if (typeof window !== "undefined") {
  app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app);
}

// --- Messaging Initialization (Singleton Pattern) ---
const initializeMessaging = async (): Promise<Messaging | null> => {
  if (messaging) {
    return messaging;
  }

  try {
    const isFCMSupported = await isSupported();
    if (!isFCMSupported) {
      console.warn("Firebase Messaging is not supported in this browser.");
      return null;
    }

    if ("serviceWorker" in navigator) {
      messaging = getMessaging(app);
      console.log("Firebase Messaging initialized successfully.");
      return messaging;
    } else {
      console.warn("Service workers are not supported in this browser.");
      return null;
    }
  } catch (error) {
    console.error("Error initializing Firebase Messaging:", error);
    return null;
  }
};

// --- Token Management ---
export const getOrCreateFCMToken = async (): Promise<string | null> => {
  console.log("Attempting to get or create FCM token...");

  const localMessaging = await initializeMessaging();

  if (!localMessaging) {
    console.error("FCM Token retrieval failed: Messaging is not initialized.");
    return null;
  }

  // 1. Check for permission
  if (Notification.permission !== "granted") {
    console.log("Requesting notification permission...");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission was not granted.");
      return null;
    }
  }

  try {
    // 2. Wait for the service worker to be ready
    console.log("Waiting for service worker to be ready...");
    await navigator.serviceWorker.ready;
    console.log("Service worker is ready.");

    // 3. Get the token
    console.log("Getting FCM token...");
    const currentToken = await getToken(localMessaging, {
      vapidKey: VAPID_KEY,
    });

    if (currentToken) {
      console.log("FCM Token received:", currentToken);
      const savedToken = localStorage.getItem("fcmToken");

      // 4. Save to localStorage if it's new or different
      if (currentToken !== savedToken) {
        console.log("New or updated token. Saving to localStorage.");
        localStorage.setItem("fcmToken", currentToken);
      }
      return currentToken;
    } else {
      console.warn("Failed to get FCM token. No token received from Firebase.");
      return null;
    }
  } catch (error) {
    console.error("An error occurred while retrieving FCM token:", error);
    // Clear potentially invalid token
    localStorage.removeItem("fcmToken");
    return null;
  }
};

export { app, analytics, messaging, onMessage, isSupported };
