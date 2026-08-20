import { useCallback, useEffect, useRef, useState } from "react";
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

/**
 * Why push is or is not running.
 *
 * The dashboard used to fail silently in every one of these states and drop
 * back to polling, so the bell surfaces this and offers a way out of `default`.
 */
export type WebPushStatus =
  /** No Firebase project wired up — VITE_FIREBASE_* are unset. */
  | "unconfigured"
  /** Browser has no service worker or no FCM support (incognito, old Safari). */
  | "unsupported"
  /** Nobody has answered the permission prompt yet. `enable()` can ask. */
  | "default"
  | "granted"
  | "denied";

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

function readStatus(): WebPushStatus {
  if (!isWebPushConfigured) return "unconfigured";
  if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) {
    return "unsupported";
  }
  return Notification.permission;
}

export interface UseWebPush {
  status: WebPushStatus;
  /** Prompts for permission and registers. Must be called from a click. */
  enable: () => Promise<void>;
}

/**
 * Registers this browser for Firebase web push and shows foreground messages
 * as a toast.
 *
 * Registration runs on mount only when permission is *already* granted. Asking
 * is deliberately left to `enable()`: Firefox 72+ and Safari reject a
 * permission request that no user gesture triggered, so prompting from this
 * effect meant the prompt simply never appeared and push stayed off for good.
 *
 * Every step is still best-effort — a missing Firebase project, a browser
 * without service-worker support or a denied prompt all leave the dashboard
 * working, because the bell keeps a fallback poll for exactly those cases.
 *
 * Note the tab has to be visible for `onMessage` to fire. When it is hidden FCM
 * routes the message to the service worker, which shows the desktop
 * notification, and the in-app badge stays stale until the admin comes back —
 * at which point `refetchOnFocus` in baseApi resyncs it. That is why
 * firebase-messaging-sw.js has no onBackgroundMessage handler; adding one shows
 * every desktop notification twice.
 */
export function useWebPush(): UseWebPush {
  const { token: authToken, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [registerPushToken] = useRegisterPushTokenMutation();
  const [status, setStatus] = useState<WebPushStatus>(readStatus);
  const startedRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | undefined>(undefined);

  const register = useCallback(async () => {
    // Registration is per session, not per render.
    if (startedRef.current) return;
    startedRef.current = true;

    try {
      if (!(await isSupported())) {
        setStatus("unsupported");
        return;
      }

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

      // Sent on every session even when the token has not changed. Skipping it
      // saved a request, but a token the backend had deactivated (FCM reported
      // it gone) was then never registered again, so push died permanently for
      // that browser. The endpoint upserts by token, so re-sending is cheap.
      await registerPushToken({ token: fcmToken, platform: "web" }).unwrap();
      localStorage.setItem(TOKEN_STORAGE_KEY, fcmToken);

      // Foreground messages are not shown by the service worker, so the toast
      // is the only thing the admin would see while the tab is open.
      unsubscribeRef.current = onMessage(messaging, (payload) => {
        antdNotification.info({
          message: payload.notification?.title ?? "",
          description: payload.notification?.body ?? "",
          placement: "topRight",
        });
        // Move the badge now rather than a round-trip later. The invalidation
        // behind it still runs, and only corrects a count another client
        // changed in the meantime.
        dispatch(
          notificationApi.util.updateQueryData(
            "getUnreadCount",
            undefined,
            (draft) => {
              draft.count += 1;
            },
          ),
        );
        dispatch(
          notificationApi.util.invalidateTags([
            { type: "notification", id: "LIST" },
            { type: "notification", id: "ADMIN_LIST" },
            { type: "notification", id: "COUNT" },
          ]),
        );
      });
    } catch {
      // Push is optional; the fallback poll already covers this case. Drop the
      // latch so a later mount, or the admin pressing enable, can retry.
      startedRef.current = false;
    }
  }, [dispatch, registerPushToken]);

  useEffect(() => {
    if (!isWebPushConfigured || !authToken || !user) return;

    const current = readStatus();
    setStatus(current);
    if (current !== "granted") return;

    void register();
  }, [authToken, user, register]);

  useEffect(() => () => unsubscribeRef.current?.(), []);

  const enable = useCallback(async () => {
    if (!isWebPushConfigured) return;
    if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }

    let permission: NotificationPermission;
    try {
      permission = await Notification.requestPermission();
    } catch {
      setStatus("unsupported");
      return;
    }

    setStatus(permission);
    if (permission !== "granted") return;

    await register();
  }, [register]);

  return { status, enable };
}
