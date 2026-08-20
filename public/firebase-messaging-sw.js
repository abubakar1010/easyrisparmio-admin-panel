/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging service worker for the admin dashboard.
 *
 * Deliberately does NOT define onBackgroundMessage. The backend sends a
 * `notification` payload (the mobile clients need it), which the FCM SDK's own
 * background handler already displays. Adding a handler here as well is the
 * usual cause of every desktop notification appearing twice.
 *
 * A service worker is a static file, so it cannot read Vite's build-time env
 * vars. The config arrives on the registration URL's query string instead —
 * see useWebPush(). Firebase web keys identify a project rather than
 * authorising anything, so carrying them in the URL gives nothing away.
 */
importScripts(
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js',
);

const params = new URL(self.location).searchParams;

firebase.initializeApp({
  apiKey: params.get('apiKey') || '',
  authDomain: params.get('authDomain') || '',
  projectId: params.get('projectId') || '',
  storageBucket: params.get('storageBucket') || '',
  messagingSenderId: params.get('messagingSenderId') || '',
  appId: params.get('appId') || '',
});

firebase.messaging();
