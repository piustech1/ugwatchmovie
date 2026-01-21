import { useState, useEffect, useCallback } from "react";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { ref, set, get } from "firebase/database";
import { database } from "@/lib/firebase";
import app from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const VAPID_KEY = "BD6X4WkjmZ1-peGxlTRFzOkTz34N1jxmc9gGKqdsAN01Gsdpoz4DOcX_iWutwDZZMyI1Ur0cuWGTDeA0zHHKi-o";

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported_, setIsSupported] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkSupport = async () => {
      const supported = await isSupported();
      setIsSupported(supported);
      
      if (supported && "Notification" in window) {
        setPermission(Notification.permission);
      }

      // Restore cached token if available (helps after reload / Safari private mode quirks).
      try {
        const cached = localStorage.getItem("ugawatch_fcm_token");
        if (cached) setToken(cached);
      } catch {
        // ignore
      }

      setLoading(false);
    };
    
    checkSupport();
  }, []);

  const ensureToken = useCallback(async () => {
    const messaging = getMessaging(app);

    let registration: ServiceWorkerRegistration;
    try {
      registration =
        (await navigator.serviceWorker.getRegistration("/")) ||
        (await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" }));
      await navigator.serviceWorker.ready;
    } catch (e) {
      console.error("Service worker registration failed:", e);
      toast({
        title: "Service Worker Error",
        description: "Failed to register the notification service worker.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const fcmToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (!fcmToken) return null;

      setToken(fcmToken);
      try {
        localStorage.setItem("ugawatch_fcm_token", fcmToken);
      } catch {
        // ignore
      }

      // Store token in Firebase for sending notifications later (non-blocking)
      try {
        const tokenRef = ref(database, `fcmTokens/${fcmToken.substring(0, 20)}`);
        await set(tokenRef, {
          token: fcmToken,
          createdAt: Date.now(),
          userAgent: navigator.userAgent,
        });
      } catch (e) {
        console.warn("Failed to save FCM token to database:", e);
      }

      return fcmToken;
    } catch (e: any) {
      console.error("FCM getToken failed:", e);
      const code = e?.code ? ` (${e.code})` : "";
      toast({
        title: "FCM Error",
        description: `Failed to get notification token${code}.`,
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const requestPermission = useCallback(async () => {
    if (!isSupported_) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported on this device.",
        variant: "destructive",
      });
      return false;
    }

    if (typeof window !== "undefined" && window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      toast({
        title: "Requires HTTPS",
        description: "Push notifications require HTTPS.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // If user has previously blocked notifications, the browser will NOT show a prompt again.
      if (Notification.permission === "denied") {
        setPermission("denied");
        toast({
          title: "Permission Blocked",
          description: "Notifications are blocked in your browser settings for this site.",
          variant: "destructive",
        });
        return false;
      }

      const result =
        Notification.permission === "granted" ? "granted" : await Notification.requestPermission();

      setPermission(result);

      if (result !== "granted") {
        toast({
          title: result === "default" ? "Permission Dismissed" : "Permission Denied",
          description: "You won't receive push notifications.",
          variant: "destructive",
        });
        return false;
      }

      const fcmToken = await ensureToken();
      if (!fcmToken) {
        toast({
          title: "No Device Token",
          description: "Couldn't generate a device token. Try Chrome/Edge and avoid in-app browsers.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Notifications Enabled",
        description: "You'll receive alerts for new movies and updates.",
      });

      return true;
    } catch (error: any) {
      console.error("Error enabling push notifications:", error);
      const code = error?.code ? ` (${error.code})` : "";
      const message = error?.message ? `: ${error.message}` : "";
      toast({
        title: "Error",
        description: `Failed to enable notifications${code}${message}`,
        variant: "destructive",
      });
      return false;
    }
  }, [ensureToken, isSupported_, toast]);

  // Listen for foreground messages
  useEffect(() => {
    if (!isSupported_ || permission !== "granted") return;

    const messaging = getMessaging(app);
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);

      // Show toast for foreground notifications
      toast({
        title: payload.notification?.title || payload.data?.title || "New Notification",
        description: payload.notification?.body || payload.data?.message,
      });
    });

    return () => unsubscribe();
  }, [isSupported_, permission, toast]);

  return {
    permission,
    isSupported: isSupported_,
    token,
    loading,
    requestPermission,
    isEnabled: permission === "granted",
  };
};
