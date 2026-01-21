import { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { database } from "@/lib/firebase";

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read?: boolean;
  type?: "new_movie" | "new_series" | "update" | "announcement" | "promo" | "news";
  poster?: string;
  imageUrl?: string;
  movieId?: string;
  redirectLink?: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const notificationsRef = ref(database, "notifications");
    
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationsArray = Object.entries(data).map(([id, notification]) => ({
          id,
          ...(notification as Omit<Notification, "id">)
        })).sort((a, b) => b.timestamp - a.timestamp);
        
        setNotifications(notificationsArray);
        
        // Count only unread notifications
        const unread = notificationsArray.filter(n => !n.read).length;
        setUnreadCount(unread);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (notificationId: string) => {
    const notificationRef = ref(database, `notifications/${notificationId}`);
    await update(notificationRef, { read: true });
  };

  const markAllAsRead = async () => {
    const updates: { [key: string]: boolean } = {};
    notifications.forEach(n => {
      if (!n.read) {
        updates[`notifications/${n.id}/read`] = true;
      }
    });
    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  };
};
