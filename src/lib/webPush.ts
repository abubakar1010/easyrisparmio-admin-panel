import { useEffect, useRef } from "react";
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";
import { notification as antdNotification } from "antd";
import { useAppSelector } from "../redux/hooks";
import {
  notificationApi,
  useRegisterPushTokenMutation,
} from "../redux/features/Notifications/notificationApi";
import { useAppDispatch } from "../redux/hooks";
import { firebaseConfig, firebaseVapidKey, isWebPushConfigured } from "../config";

const TOKEN_STORAGE_KEY = "fcm_web_token";

function ensureApp(): FirebaseApp {
  return getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig as Record<string, string>);
}

/** The token currently registered for this browser, if any. */
export function getStoredPushToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function clearStoredPushToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Registers this browser for Firebase web push and shows foreground messages
 * as a toast.
 *
 * Every step is best-effort. A missing Firebase project, a browser without
 * service-worker support, or a denied permission prompt all leave the
 * dashboard working exactly as before — the bell polls regardless, so push is
 * an upgrade rather than a dependency.
 */
export function useWebPush(): void {
  const { token: authToken, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [registerPushToken] = useRegisterPushTokenMutation();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isWebPushConfigured || !authToken || !user) return;
    // Registration is per session, not per render.
    if (startedRef.current) return;
    startedRef.current = true;

    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        if (!(await isSupported())) return;
        if (!("serviceWorker" in navigator)) return;

        // Asking on load is intrusive, but the admin console is a tool people
        // opt into; a denied prompt is remembered by the browser and never
        // shown again.
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        // The worker is a static file and cannot read Vite env vars, so the
        // project config rides along on the query string.
        const swUrl = `/firebase-messaging-sw.js?${new URLSearchParams(
          Object.entries(firebaseConfig).filter(
            (entry): entry is [string, string] => Boolean(entry[1]),
          ),
        ).toString()}`;
        const registration = await navigator.serviceWorker.register(swUrl);
        const messaging = getMessaging(ensureApp());

        const fcmToken = await getToken(messaging, {
          vapidKey: firebaseVapidKey,
          serviceWorkerRegistration: registration,
        });
        if (!fcmToken) return;

        // Re-registering the same token is harmless — the backend upserts by
        // token — but skipping it saves a request on every page load.
        if (getStoredPushToken() !== fcmToken) {
          await registerPushToken({
            token: fcmToken,
            platform: "web",
          }).unwrap();
          localStorage.setItem(TOKEN_STORAGE_KEY, fcmToken);
        }

        // Foreground messages are not shown by the service worker, so the
        // toast is the only thing the admin would see while the tab is open.
        unsubscribe = onMessage(messaging, (payload) => {
          antdNotification.info({
            message: payload.notification?.title ?? "",
            description: payload.notification?.body ?? "",
            placement: "topRight",
          });
          dispatch(
            notificationApi.util.invalidateTags([
              { type: "notification", id: "LIST" },
              { type: "notification", id: "ADMIN_LIST" },
              { type: "notification", id: "COUNT" },
            ]),
          );
        });
      } catch {
        // Push is optional; the polling bell already covers this case.
      }
    })();

    return () => unsubscribe?.();
  }, [authToken, user, registerPushToken, dispatch]);
}
