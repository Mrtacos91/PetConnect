/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */


import * as functions from 'firebase-functions';
import cors from 'cors';
import * as admin from 'firebase-admin';

admin.initializeApp();

const corsHandler = cors({
  origin: [
    'https://petconnectmx.netlify.app',
    'http://localhost:3000'
  ],
  methods: ['POST', 'OPTIONS'],
  credentials: true
});

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

export const sendNotification = functions.https.onRequest((req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const { token, notification, data } = req.body;

      if (!token || !notification) {
        res.status(400).json({ error: 'Token y notificación son requeridos' });
        return;
      }

      const message = {
        token,
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/images/Logo_gradient.png'
        },
        data: data || {},
        webpush: {
          fcmOptions: {
            link: data?.url || '/'
          }
        }
      };

      const response = await admin.messaging().send(message);
      res.status(200).json({ success: true, messageId: response });
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      res.status(500).json({ error: 'Error al enviar notificación' });
    }
  });
});
