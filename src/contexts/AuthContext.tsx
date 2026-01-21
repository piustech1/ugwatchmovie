import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, database, googleProvider, facebookProvider } from "@/lib/firebase";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import app from "@/lib/firebase";

const VAPID_KEY = "BHmApSRO5gd4hk-n2IDARVVIUuyYajgeZzzcGO7h-fG5nuMs7_6_ATA-Vtxb8f9e_bJx390WmrNOK5rnXKXWrCo";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Auto-enable push notifications for new users
const autoEnablePushNotifications = async () => {
  try {
    // Check if push notifications are supported
    const supported = await isSupported();
    if (!supported) {
      console.log("Push notifications not supported");
      return;
    }

    // Check if we're on HTTPS or localhost
    if (typeof window !== "undefined" && window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      console.log("Push notifications require HTTPS");
      return;
    }

    // Request permission
    const result = await Notification.requestPermission();
    if (result !== "granted") {
      console.log("Notification permission denied");
      return;
    }

    // Register service worker
    let registration: ServiceWorkerRegistration;
    try {
      registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
    } catch (e) {
      console.error("Service worker registration failed:", e);
      return;
    }

    // Get FCM token
    const messaging = getMessaging(app);
    const fcmToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!fcmToken) {
      console.log("No FCM token received");
      return;
    }

    // Store token locally
    try {
      localStorage.setItem("ugawatch_fcm_token", fcmToken);
    } catch {
      // ignore
    }

    // Store token in Firebase
    const tokenRef = ref(database, `fcmTokens/${fcmToken.substring(0, 20)}`);
    await set(tokenRef, {
      token: fcmToken,
      createdAt: Date.now(),
      userAgent: navigator.userAgent,
    });

    console.log("Push notifications enabled automatically");
  } catch (error) {
    console.error("Error auto-enabling push notifications:", error);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    // Create user profile in database
    await set(ref(database, `users/${userCredential.user.uid}`), {
      name,
      email,
      joined: Date.now(),
      subscription: "free",
      pushNotificationsEnabled: true, // Default to enabled
    });

    // Auto-enable push notifications for new users
    // Use setTimeout to ensure the UI has settled first
    setTimeout(() => {
      autoEnablePushNotifications();
    }, 1500);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    
    // Also try to enable push notifications on login if not already enabled
    const storedToken = localStorage.getItem("ugawatch_fcm_token");
    if (!storedToken) {
      setTimeout(() => {
        autoEnablePushNotifications();
      }, 1500);
    }
  };

  const signInWithGoogleHandler = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user profile exists
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      // Create new user profile
      await set(userRef, {
        name: user.displayName || "User",
        email: user.email,
        joined: Date.now(),
        subscription: "free",
        pushNotificationsEnabled: true,
      });
      
      // Auto-enable push notifications for new users
      setTimeout(() => {
        autoEnablePushNotifications();
      }, 1500);
    } else {
      // Existing user - try to enable push if not already
      const storedToken = localStorage.getItem("ugawatch_fcm_token");
      if (!storedToken) {
        setTimeout(() => {
          autoEnablePushNotifications();
        }, 1500);
      }
    }
  };

  const signInWithFacebookHandler = async () => {
    const result = await signInWithPopup(auth, facebookProvider);
    const user = result.user;
    
    // Check if user profile exists
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      // Create new user profile
      await set(userRef, {
        name: user.displayName || "User",
        email: user.email,
        joined: Date.now(),
        subscription: "free",
        pushNotificationsEnabled: true,
      });
      
      // Auto-enable push notifications for new users
      setTimeout(() => {
        autoEnablePushNotifications();
      }, 1500);
    } else {
      // Existing user - try to enable push if not already
      const storedToken = localStorage.getItem("ugawatch_fcm_token");
      if (!storedToken) {
        setTimeout(() => {
          autoEnablePushNotifications();
        }, 1500);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, login, signInWithGoogle: signInWithGoogleHandler, signInWithFacebook: signInWithFacebookHandler, logout }}>
      {children}
    </AuthContext.Provider>
  );
};