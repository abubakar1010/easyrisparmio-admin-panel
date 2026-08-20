const config = {
  server_url: import.meta.env.VITE_SERVER_URL as string,
  // imageUrl: process.env.NEXT_PUBLIC_IMAGE_URL as string,
  // jwtSecret: process.env.JWT_SECRET_KEY as string,
  // apiKey: process.env.API_KEY,
  //   isProduction: process.env.NODE_ENV === 'production',
};

export const { server_url } = config;

/**
 * Firebase web-push configuration.
 *
 * Every field is optional on purpose: with no Firebase project wired up the
 * dashboard still builds and the in-app bell still works — web push simply
 * stays off, mirroring how the backend skips FCM when its credentials are
 * absent.
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as
    | string
    | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as
    | string
    | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

export const firebaseVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as
  | string
  | undefined;

/** True only when every value web push needs is present. */
export const isWebPushConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    firebaseVapidKey,
);
// Base server origin without API path prefix (for static files like /uploads/)
export const server_origin = server_url.replace(/\/api\/v1\/?$/, '');
